(function exposeAnalysisDialogue(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DreamAnalysisDialogue = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeAnalysisDialogueAPI() {
  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function splitLongSentence(sentence, maxCharacters) {
    const words = sentence.split(' ');
    const chunks = [];
    let current = '';
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (current && next.length > maxCharacters) {
        chunks.push(current);
        current = word;
      } else {
        current = next;
      }
    });
    if (current) chunks.push(current);
    return chunks;
  }

  function paginateResponse(response, { maxCharacters = 220 } = {}) {
    const text = cleanText(response);
    if (!text) return [];
    const limit = Math.max(72, Number(maxCharacters) || 220);
    const sentences = text.match(/[^.!?]+[.!?]+(?:[”"']+)?|[^.!?]+$/g)?.map(cleanText).filter(Boolean) || [text];
    const units = sentences.flatMap(sentence => sentence.length > limit ? splitLongSentence(sentence, limit) : [sentence]);
    const pages = [];
    let page = '';
    units.forEach(unit => {
      const next = page ? `${page} ${unit}` : unit;
      if (page && next.length > limit) {
        pages.push(page);
        page = unit;
      } else {
        page = next;
      }
    });
    if (page) pages.push(page);
    return pages;
  }

  function createTypewriterDialogue({
    pages,
    onUpdate = () => {},
    schedule = (callback, delay) => setTimeout(callback, delay),
    cancel = timer => clearTimeout(timer),
    reducedMotion = false,
    characterDelay = 22
  } = {}) {
    const dialoguePages = (Array.isArray(pages) ? pages : []).map(cleanText).filter(Boolean);
    if (!dialoguePages.length) throw new Error('At least one dialogue page is required.');
    let pageIndex = 0;
    let visibleText = '';
    let typing = false;
    let timer = null;
    let destroyed = false;

    function snapshot() {
      return {
        pageIndex,
        pageCount: dialoguePages.length,
        pageText: dialoguePages[pageIndex],
        visibleText,
        typing,
        finalPage: pageIndex === dialoguePages.length - 1,
        complete: pageIndex === dialoguePages.length - 1 && !typing && visibleText === dialoguePages[pageIndex]
      };
    }

    function emit() {
      if (!destroyed) onUpdate(snapshot());
    }

    function clearTimer() {
      if (timer !== null) cancel(timer);
      timer = null;
    }

    function nextDelay(character) {
      if (/[.!?]/.test(character)) return characterDelay * 7;
      if (/[,;:]/.test(character)) return characterDelay * 3;
      return characterDelay;
    }

    function typeNextCharacter() {
      if (destroyed || !typing) return;
      const page = dialoguePages[pageIndex];
      if (visibleText.length >= page.length) {
        typing = false;
        timer = null;
        emit();
        return;
      }
      visibleText = page.slice(0, visibleText.length + 1);
      emit();
      if (visibleText.length >= page.length) {
        typing = false;
        timer = null;
        emit();
        return;
      }
      timer = schedule(typeNextCharacter, nextDelay(visibleText.at(-1)));
    }

    function beginPage() {
      clearTimer();
      visibleText = reducedMotion ? dialoguePages[pageIndex] : '';
      typing = !reducedMotion;
      emit();
      if (typing) timer = schedule(typeNextCharacter, characterDelay);
    }

    function start() {
      destroyed = false;
      pageIndex = 0;
      beginPage();
      return snapshot();
    }

    function activate() {
      if (destroyed) return 'destroyed';
      if (typing) {
        clearTimer();
        visibleText = dialoguePages[pageIndex];
        typing = false;
        emit();
        return 'revealed';
      }
      if (pageIndex < dialoguePages.length - 1) {
        pageIndex += 1;
        beginPage();
        return 'advanced';
      }
      emit();
      return 'complete';
    }

    function destroy() {
      clearTimer();
      typing = false;
      destroyed = true;
    }

    return { activate, destroy, snapshot, start };
  }

  return { createTypewriterDialogue, paginateResponse };
});
