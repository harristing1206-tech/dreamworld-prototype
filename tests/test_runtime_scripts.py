import importlib.util
import json
import os
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = Path("/home/hermes/.local/lib/dreamworld")
SYSTEMD = Path("/home/hermes/.config/systemd/user")


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    assert spec.loader
    spec.loader.exec_module(module)
    return module


class RuntimeTokenTests(unittest.TestCase):
    def test_gbrain_http_never_prints_bootstrap_token(self):
        unit = (SYSTEMD / "gbrain-http.service").read_text(encoding="utf-8")
        self.assertIn("--suppress-bootstrap-token", unit)
        self.assertIn("SuccessExitStatus=143", unit)
        env_path = Path.home() / ".config/gbrain-http/service.env"
        if env_path.exists():
            mode = stat.S_IMODE(env_path.stat().st_mode)
            self.assertEqual(mode, 0o600)
            values = dict(line.split("=", 1) for line in env_path.read_text().splitlines() if "=" in line and not line.startswith("#"))
            self.assertGreaterEqual(len(values.get("GBRAIN_ADMIN_BOOTSTRAP_TOKEN", "")), 32)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        base = Path(self.temp.name)
        self.repo = base / "repo"
        self.root = base / "install"
        self.repo.mkdir()
        subprocess.run(["git", "init", "-q"], cwd=self.repo, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.test"], cwd=self.repo, check=True)
        subprocess.run(["git", "config", "user.name", "Test"], cwd=self.repo, check=True)
        self.install = load_module("dreamworld_install_release_test", RUNTIME / "install_release.py")
        self.activate = load_module("dreamworld_activate_release_test", RUNTIME / "activate_release.py")
        for relative in self.install.ALLOWLIST:
            target = self.repo / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            if relative == "world.html":
                target.write_text('<script src="analysis-dialogue.js?v=35"></script>', encoding="utf-8")
            elif relative == "service-worker.js":
                target.write_text('const CACHE = "dreamworld-world-v35";', encoding="utf-8")
            elif relative.endswith(".png"):
                target.write_bytes(b"fixture-png")
            elif relative.endswith((".json", ".webmanifest")):
                target.write_text("{}\n", encoding="utf-8")
            elif relative.endswith(".py"):
                target.write_text("# fixture server\n", encoding="utf-8")
            else:
                target.write_text("// fixture runtime asset\n", encoding="utf-8")
        (self.repo / "package.json").write_text('{"repository":"owner-linked/metadata"}\n', encoding="utf-8")
        subprocess.run(["git", "add", "."], cwd=self.repo, check=True)
        subprocess.run(["git", "commit", "-qm", "fixture"], cwd=self.repo, check=True)
        self.commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=self.repo, check=True, text=True, capture_output=True).stdout.strip()
        self.install.REPO = self.repo
        self.install.ROOT = self.root
        self.install.RELEASES = self.root / "releases"
        self.install.CURRENT = self.root / "current"

    def tearDown(self):
        self.temp.cleanup()

    def test_valid_release_manifest_and_current_target_verify(self):
        release = self.install.install_release(self.commit)
        self.install.verify_release(release, self.commit, repo=self.repo)
        current = self.root / "current"
        current.symlink_to(release)
        resolved_commit = self.activate.validate_current_release(current, self.root / "releases", repo=self.repo)
        self.assertEqual(resolved_commit, self.commit)
        manifest = json.loads((release / self.install.MANIFEST_NAME).read_text())
        self.assertEqual(manifest["commit"], self.commit)
        self.assertIn("index.html", manifest["files"])
        actual_files = {
            str(path.relative_to(release))
            for path in release.rglob("*")
            if path.is_file()
        }
        self.assertEqual(actual_files, set(self.install._expected_outputs()) | {self.install.MANIFEST_NAME})
        self.assertNotIn("package.json", actual_files)
        self.assertFalse(any("owner-linked" in path.read_text(errors="ignore") for path in release.rglob("*") if path.is_file()))

    def test_preexisting_release_tamper_is_rejected(self):
        release = self.install.install_release(self.commit)
        (release / "analysis-dialogue.js").chmod(0o644)
        (release / "analysis-dialogue.js").write_text("tampered")
        with self.assertRaisesRegex(RuntimeError, "mismatch|writable|hash"):
            self.install.install_release(self.commit)

    def test_activation_rejects_arbitrary_current_target(self):
        arbitrary = Path(self.temp.name) / "arbitrary"
        arbitrary.mkdir()
        current = self.root / "current"
        current.parent.mkdir(parents=True, exist_ok=True)
        current.symlink_to(arbitrary)
        with self.assertRaisesRegex(RuntimeError, "releases|target"):
            self.activate.validate_current_release(current, self.root / "releases", repo=self.repo)

    def test_activation_rejects_writable_release_file(self):
        release = self.install.install_release(self.commit)
        (release / "analysis-dialogue.js").chmod(0o644)
        current = self.root / "current"
        current.symlink_to(release)
        with self.assertRaisesRegex(RuntimeError, "writable|mode"):
            self.activate.validate_current_release(current, self.root / "releases", repo=self.repo)


class MigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        base = Path(self.temp.name)
        self.migration = load_module("dreamworld_migration_test", RUNTIME / "migrate_gbrain_http.py")
        self.migration.HERMES_ENV = base / "hermes.env"
        self.migration.BRIDGE_ENV = base / "bridge.env"
        self.migration.CONFIG = base / "config.yaml"
        self.migration.BACKUP_DIR = base / "backup"
        self.migration.PENDING = self.migration.BACKUP_DIR / "pending.json"
        self.migration.BACKUP_TARGETS = (("hermes.env", self.migration.HERMES_ENV), ("bridge.env", self.migration.BRIDGE_ENV), ("config.yaml", self.migration.CONFIG))

    def tearDown(self):
        self.temp.cleanup()

    def _prepared(self):
        self.migration.HERMES_ENV.write_text("MCP_GBRAIN_API_KEY=private-token-value-long\n")
        originals = self.migration._snapshot()
        self.migration.HERMES_ENV.write_text("changed\n")
        self.migration._write_private_json(self.migration.PENDING, {"schemaVersion": 1, "phase": "prepared", "originals": originals, "expectedSources": list(self.migration.EXPECTED_SOURCES), "preparedAt": 1})
        return originals

    def test_finalize_requires_probe_then_marks_committed(self):
        self._prepared()
        with patch.object(self.migration, "mandatory_http_topology_probe") as topology, patch.object(self.migration, "gateway_remote_probe") as probe:
            self.migration.finalize()
        topology.assert_called_once_with()
        probe.assert_called_once_with()
        payload = self.migration.load_pending(allow_committed=True)
        self.assertEqual(payload["phase"], "committed")
        self.assertEqual(stat.S_IMODE(self.migration.PENDING.stat().st_mode), 0o600)

    def test_finalize_probe_failure_keeps_rollback_pending(self):
        self._prepared()
        with patch.object(self.migration, "mandatory_http_topology_probe"), patch.object(self.migration, "gateway_remote_probe", side_effect=RuntimeError("probe failed")):
            with self.assertRaisesRegex(RuntimeError, "probe failed"):
                self.migration.finalize()
        self.assertEqual(self.migration.load_pending()["phase"], "prepared")

    def test_finalize_topology_failure_keeps_rollback_pending(self):
        self._prepared()
        with patch.object(self.migration, "mandatory_http_topology_probe", side_effect=RuntimeError("topology failed")), patch.object(self.migration, "gateway_remote_probe") as remote:
            with self.assertRaisesRegex(RuntimeError, "topology failed"):
                self.migration.finalize()
        remote.assert_not_called()
        self.assertEqual(self.migration.load_pending()["phase"], "prepared")

    def test_rollback_disables_http_and_restores_snapshot(self):
        self._prepared()
        with patch.object(self.migration, "gateway_running", return_value=False), patch.object(self.migration, "ensure_http_inactive") as stopped, patch.object(self.migration, "cleanup_auth_state") as cleaned:
            self.migration.rollback()
        stopped.assert_called_once_with()
        cleaned.assert_called_once_with()
        self.assertIn("private-token-value-long", self.migration.HERMES_ENV.read_text())
        self.assertFalse(self.migration.PENDING.exists())
        self.assertTrue((self.migration.BACKUP_DIR / "rolled-back.json").is_file())


    def test_rollback_accepts_committed_manifest_defensively(self):
        self._prepared()
        payload = self.migration.load_pending()
        payload["phase"] = "committed"
        self.migration._write_private_json(self.migration.PENDING, payload)
        with patch.object(self.migration, "gateway_running", return_value=False), patch.object(self.migration, "ensure_http_inactive"), patch.object(self.migration, "cleanup_auth_state"):
            self.migration.rollback()
        self.assertTrue((self.migration.BACKUP_DIR / "rolled-back.json").is_file())

    def test_unprivileged_rollback_refuses_while_gateway_is_running(self):
        self._prepared()
        with patch.object(self.migration, "gateway_running", return_value=True):
            with self.assertRaisesRegex(RuntimeError, "stop it externally"):
                self.migration.rollback()

    def test_strict_http_stop_requires_inactive_before_restoration(self):
        with patch.object(self.migration.subprocess, "run") as run_mock, patch.object(self.migration, "_user_service_state", return_value="active"):
            with self.assertRaisesRegex(RuntimeError, "did not stop"):
                self.migration.ensure_http_inactive()
        commands = [call.args[0] for call in run_mock.call_args_list]
        self.assertTrue(any("disable" in command for command in commands))
        self.assertFalse(any("reset-failed" in command for command in commands))

    def test_strict_http_stop_resets_failed_then_requires_inactive(self):
        with patch.object(self.migration.subprocess, "run") as run_mock, patch.object(self.migration, "_user_service_state", side_effect=["failed", "inactive"]):
            self.migration.ensure_http_inactive()
        commands = [call.args[0] for call in run_mock.call_args_list]
        self.assertTrue(any("disable" in command for command in commands))
        self.assertTrue(any("reset-failed" in command for command in commands))

    def test_rollback_never_restores_snapshot_when_http_stop_is_unverified(self):
        self._prepared()
        with patch.object(self.migration, "gateway_running", return_value=False), \
             patch.object(self.migration, "ensure_http_inactive", side_effect=RuntimeError("did not stop")), \
             patch.object(self.migration, "_restore_snapshot") as restore:
            with self.assertRaisesRegex(RuntimeError, "did not stop"):
                self.migration.rollback()
        restore.assert_not_called()

    def test_prepare_failure_proves_http_inactive_before_restoring_snapshot(self):
        events = []
        with patch.object(self.migration, "gateway_running", return_value=False), \
             patch.object(self.migration, "_snapshot", return_value={}), \
             patch.object(self.migration, "run", side_effect=RuntimeError("prepare failed")), \
             patch.object(self.migration, "ensure_http_inactive", side_effect=lambda: events.append("stop")), \
             patch.object(self.migration, "cleanup_auth_state", side_effect=lambda: events.append("auth-cleanup")), \
             patch.object(self.migration, "_restore_snapshot", side_effect=lambda _originals: events.append("restore")), \
             patch.object(self.migration.shutil, "rmtree"):
            with self.assertRaisesRegex(RuntimeError, "prepare failed"):
                self.migration.prepare()
        self.assertEqual(events, ["stop", "stop", "auth-cleanup", "restore"])

    def test_gateway_token_helper_atomically_rotates_fixed_scoped_token(self):
        helper = (RUNTIME / "scope_gateway_token.ts").read_text(encoding="utf-8")
        migration = (RUNTIME / "migrate_gbrain_http.py").read_text(encoding="utf-8")
        self.assertIn("randomBytes(32)", helper)
        self.assertIn("engine.transaction(async tx", helper)
        self.assertIn("DELETE FROM access_tokens WHERE name = $1", helper)
        self.assertIn("DELETE FROM oauth_clients WHERE client_name = $1", helper)
        self.assertIn("inserted.length !== 1", helper)
        self.assertIn("stale_legacy !== 0", helper)
        self.assertIn("source_id: ['default', 'gerri', 'dreamworld']", helper)
        self.assertIn("SCOPED_GATEWAY_TOKEN=", helper)
        self.assertIn('"prepare-auth"], sensitive=True', migration)
        self.assertIn("cleanup_auth_state()", migration)
        self.assertIn("DREAMWORLD_AUTH_CLEANUP_OK", helper)

    def test_scoped_gateway_token_parser_is_exact_and_bounded(self):
        token = "gbrain_" + "a" * 64
        self.assertEqual(self.migration.parse_scoped_gateway_token(f"DREAMWORLD_AUTH_PREPARE_OK\nSCOPED_GATEWAY_TOKEN={token}\n"), token)
        malformed = [
            f"prefix\nDREAMWORLD_AUTH_PREPARE_OK\nSCOPED_GATEWAY_TOKEN={token}\n",
            f"DREAMWORLD_AUTH_PREPARE_OK suffix\nSCOPED_GATEWAY_TOKEN={token}\n",
            "DREAMWORLD_AUTH_PREPARE_OK\nSCOPED_GATEWAY_TOKEN=gbrain_a\n",
            f"DREAMWORLD_AUTH_PREPARE_OK\nSCOPED_GATEWAY_TOKEN={token}\nSCOPED_GATEWAY_TOKEN={token}\n",
            f"DREAMWORLD_AUTH_PREPARE_OK\nSCOPED_GATEWAY_TOKEN={token.upper()}\n",
        ]
        for value in malformed:
            with self.subTest(value=value[:40]):
                with self.assertRaises(RuntimeError):
                    self.migration.parse_scoped_gateway_token(value)

    def test_prepare_refuses_before_snapshot_when_http_is_not_inactive(self):
        with patch.object(self.migration, "gateway_running", return_value=False), \
             patch.object(self.migration, "ensure_http_inactive", side_effect=RuntimeError("not inactive")), \
             patch.object(self.migration, "_snapshot") as snapshot:
            with self.assertRaisesRegex(RuntimeError, "not inactive"):
                self.migration.prepare()
        snapshot.assert_not_called()

    def test_rollback_revocation_failure_blocks_restoration(self):
        self._prepared()
        with patch.object(self.migration, "gateway_running", return_value=False), \
             patch.object(self.migration, "ensure_http_inactive"), \
             patch.object(self.migration, "cleanup_auth_state", side_effect=RuntimeError("cleanup unverified")), \
             patch.object(self.migration, "_restore_snapshot") as restore:
            with self.assertRaisesRegex(RuntimeError, "cleanup unverified"):
                self.migration.rollback()
        restore.assert_not_called()


    def test_existing_dreamworld_source_is_verified_idempotently(self):
        payload = json.dumps({"sources": [{"id": "dreamworld", "name": "Dreamworld private dreams", "federated": False}]})
        with patch.object(self.migration.subprocess, "run", return_value=subprocess.CompletedProcess([], 1, stdout="", stderr="already exists")) as add, \
             patch.object(self.migration, "run", return_value=payload):
            self.migration.ensure_dreamworld_source()
        self.assertIn("sources_add", add.call_args.args[0])

    def test_dreamworld_source_verification_rejects_wrong_isolation(self):
        payload = json.dumps({"sources": [{"id": "dreamworld", "name": "Dreamworld private dreams", "federated": True}]})
        with patch.object(self.migration.subprocess, "run", return_value=subprocess.CompletedProcess([], 1)), patch.object(self.migration, "run", return_value=payload):
            with self.assertRaisesRegex(RuntimeError, "required isolation"):
                self.migration.ensure_dreamworld_source()

    def test_dreamworld_oauth_probe_exercises_scoped_query_and_exact_crud(self):
        calls = []
        content_holder = {}

        def fake_call(_token, name, arguments, **_kwargs):
            calls.append((name, dict(arguments)))
            if name == "put_page":
                content_holder.update(slug=arguments["slug"], content=arguments["content"])
                return {"ok": True}
            if name == "get_page":
                return {"slug": content_holder["slug"], "content": content_holder["content"], "source_id": "dreamworld", "deleted_at": "now" if arguments.get("include_deleted") else None}
            return {"results": []}

        with patch.object(self.migration, "mint_client_token", return_value="token-value-long-enough"), patch.object(self.migration.secrets, "token_hex", return_value="a" * 32), patch.object(self.migration, "mcp_call", side_effect=fake_call):
            self.migration.probe_dreamworld_client("client", "secret")
        self.assertEqual([name for name, _ in calls], ["query", "put_page", "get_page", "delete_page", "get_page"])
        self.assertEqual(calls[0][1]["source_id"], "dreamworld")
        self.assertEqual(calls[2][1]["source_id"], "dreamworld")
        self.assertEqual(calls[4][1]["source_id"], "dreamworld")
        self.assertTrue(calls[-1][1]["include_deleted"])
        self.assertIn("transcriptFingerprint", calls[1][1]["content"])

    def test_legacy_gateway_bearer_queries_every_expected_source(self):
        calls = []
        with patch.object(self.migration, "mcp_call", side_effect=lambda token, name, arguments, **kwargs: calls.append((token, name, arguments)) or {"results": []}):
            self.migration.probe_legacy_sources("gateway-token-long-enough")
        self.assertEqual([call[2]["source_id"] for call in calls], list(self.migration.EXPECTED_SOURCES))

    def test_migration_source_has_no_premature_ready_marker_or_secret_journal(self):
        source = (RUNTIME / "migrate_gbrain_http.py").read_text(encoding="utf-8")
        self.assertNotIn("MIGRATION_READY", source)
        self.assertIn("MIGRATION_PREPARED_PENDING_GATEWAY_RESTART_AND_FINALIZE", source)
        self.assertTrue((RUNTIME / "finalize_gbrain_http.py").is_file())
        self.assertTrue((RUNTIME / "rollback_gbrain_http.py").is_file())


class RootOrchestrationTests(unittest.TestCase):
    def setUp(self):
        self.orchestrator = load_module("dreamworld_root_orchestrator_test", RUNTIME / "orchestrate_gbrain_migration.py")
        self.real_process_cmdline = self.orchestrator.process_cmdline
        self.executable_patch = patch.object(self.orchestrator, "process_executable", return_value=self.orchestrator.BUN_EXECUTABLE)
        def default_cmdline(pid):
            if pid == 201:
                return ("bun", *self.orchestrator.HTTP_ARGUMENTS)
            if pid in {101, 103, 202}:
                return ("bun", self.orchestrator.GBRAIN_EXECUTABLE, "serve")
            if pid == 102:
                return ("/tmp/gbrain", "serve")
            return ("python", "unrelated")
        self.cmdline_patch = patch.object(self.orchestrator, "process_cmdline", side_effect=default_cmdline)
        self.service_pid_patch = patch.object(self.orchestrator, "user_service_main_pid", return_value=201)
        self.executable_patch.start()
        self.cmdline_patch.start()
        self.service_pid_patch.start()

    def tearDown(self):
        self.service_pid_patch.stop()
        self.cmdline_patch.stop()
        self.executable_patch.stop()

    def test_process_cmdline_reads_exact_nul_delimited_argv(self):
        with tempfile.TemporaryDirectory() as temp:
            proc_root = Path(temp)
            process = proc_root / "321"
            process.mkdir()
            (process / "cmdline").write_bytes(b"bun\0/home/hermes/.bun/bin/gbrain\0serve\0--http\0--evil\0")
            self.assertEqual(
                self.real_process_cmdline(321, proc_root),
                ("bun", "/home/hermes/.bun/bin/gbrain", "serve", "--http", "--evil"),
            )

    def test_transient_process_disappearance_is_ignored_but_owner_check_remains_fail_closed(self):
        active = subprocess.CompletedProcess([], 0, stdout="active\n", stderr="")
        rows = [(201, 1, "bun /home/hermes/.bun/bin/gbrain serve --http --port 3131 --suppress-bootstrap-token"), (999, 1, "stale")]
        def cmdline(pid):
            if pid == 999:
                raise RuntimeError("Cannot verify argv")
            return ("bun", *self.orchestrator.HTTP_ARGUMENTS)
        with patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "run", return_value=active), \
             patch.object(self.orchestrator, "process_rows", return_value=rows), \
             patch.object(self.orchestrator, "process_cmdline", side_effect=cmdline), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={201}):
            self.orchestrator.verify_http_topology()
        with patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "run", return_value=active), \
             patch.object(self.orchestrator, "process_rows", return_value=rows), \
             patch.object(self.orchestrator, "process_cmdline", side_effect=cmdline), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={201, 999}):
            with self.assertRaisesRegex(RuntimeError, "sole verified PGLite owner"):
                self.orchestrator.verify_http_topology()

    def test_migration_failure_diagnostic_redacts_gbrain_tokens(self):
        failed = subprocess.CompletedProcess([], 1, stdout="", stderr="command failed with gbrain_secret123")
        with patch.object(self.orchestrator, "run", return_value=failed):
            with self.assertRaisesRegex(RuntimeError, r"\[REDACTED\]") as raised:
                self.orchestrator.run_migration("prepare")
        self.assertNotIn("gbrain_secret123", str(raised.exception))

    def test_success_orders_stop_prepare_start_finalize_and_topology_probe(self):
        events = []
        def fake_run(args, check=True):
            events.append(tuple(args))
            return subprocess.CompletedProcess(args, 0, stdout="active\n", stderr="")
        with patch.object(self.orchestrator.os, "geteuid", return_value=0), \
             patch.object(self.orchestrator, "run", side_effect=fake_run), \
             patch.object(self.orchestrator, "run_migration", side_effect=lambda phase: events.append(("migration", phase))), \
             patch.object(self.orchestrator, "wait_gateway_health", side_effect=lambda: events.append(("health",))), \
             patch.object(self.orchestrator, "verify_http_topology", side_effect=lambda: events.append(("http-topology",))):
            self.orchestrator.migrate()
        self.assertLess(events.index(("systemctl", "stop", self.orchestrator.SERVICE)), events.index(("migration", "prepare")))
        self.assertLess(events.index(("migration", "prepare")), events.index(("systemctl", "start", self.orchestrator.SERVICE)))
        self.assertLess(events.index(("systemctl", "start", self.orchestrator.SERVICE)), events.index(("http-topology",)))
        self.assertLess(events.index(("http-topology",)), events.index(("migration", "finalize")))
        self.assertIn(("http-topology",), events)

    def test_finalize_failure_invokes_verified_rollback(self):
        phases = []
        def migration(phase):
            phases.append(phase)
            if phase == "finalize":
                raise RuntimeError("probe failed")
        with patch.object(self.orchestrator.os, "geteuid", return_value=0), \
             patch.object(self.orchestrator, "run", return_value=subprocess.CompletedProcess([], 0, stdout="", stderr="")), \
             patch.object(self.orchestrator, "run_migration", side_effect=migration), \
             patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "verify_http_topology"), \
             patch.object(self.orchestrator, "rollback_and_verify") as rollback:
            with self.assertRaisesRegex(RuntimeError, "probe failed"):
                self.orchestrator.migrate()
        self.assertEqual(phases, ["prepare", "finalize"])
        rollback.assert_called_once_with()

    def test_restored_stdio_owner_requires_exact_descendant_and_no_competing_pglite_owner(self):
        rows = [
            (100, 1, "/usr/local/bin/hermes gateway run"),
            (101, 100, "bun /home/hermes/.bun/bin/gbrain serve"),
            (999, 1, "python unrelated-gbrain-serve-monitor"),
        ]
        inactive = subprocess.CompletedProcess([], 3, stdout="inactive\n", stderr="")
        with patch.object(self.orchestrator, "gateway_main_pid", return_value=100), \
             patch.object(self.orchestrator, "process_rows", return_value=rows), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={101}), \
             patch.object(self.orchestrator, "run", return_value=inactive):
            self.orchestrator.verify_restored_stdio_owner()
        with patch.object(self.orchestrator, "gateway_main_pid", return_value=100), \
             patch.object(self.orchestrator, "process_rows", return_value=rows), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={101, 999}), \
             patch.object(self.orchestrator, "run", return_value=inactive):
            with self.assertRaisesRegex(RuntimeError, "sole verified PGLite owner"):
                self.orchestrator.verify_restored_stdio_owner()
        arbitrary = [(100, 1, "/usr/local/bin/hermes gateway run"), (102, 100, "/tmp/gbrain serve")]
        with patch.object(self.orchestrator, "gateway_main_pid", return_value=100), \
             patch.object(self.orchestrator, "process_rows", return_value=arbitrary), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={102}), \
             patch.object(self.orchestrator, "run", return_value=inactive):
            with self.assertRaisesRegex(RuntimeError, "does not own a GBrain stdio"):
                self.orchestrator.verify_restored_stdio_owner()
        competing_descendants = rows + [(103, 100, "bun /home/hermes/.bun/bin/gbrain serve")]
        with patch.object(self.orchestrator, "gateway_main_pid", return_value=100), \
             patch.object(self.orchestrator, "process_rows", return_value=competing_descendants), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={101, 103}), \
             patch.object(self.orchestrator, "run", return_value=inactive):
            with self.assertRaisesRegex(RuntimeError, "does not own a GBrain stdio"):
                self.orchestrator.verify_restored_stdio_owner()
        with patch.object(self.orchestrator, "gateway_main_pid", return_value=100), \
             patch.object(self.orchestrator, "process_rows", return_value=rows), \
             patch.object(self.orchestrator, "process_executable", return_value="/tmp/bun"), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={101}), \
             patch.object(self.orchestrator, "run", return_value=inactive):
            with self.assertRaisesRegex(RuntimeError, "does not own a GBrain stdio"):
                self.orchestrator.verify_restored_stdio_owner()

    def test_http_topology_requires_exact_sole_pglite_owner_and_no_stdio(self):
        active = subprocess.CompletedProcess([], 0, stdout="active\n", stderr="")
        http_rows = [(201, 1, "bun /home/hermes/.bun/bin/gbrain serve --http --port 3131 --suppress-bootstrap-token")]
        with patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "run", return_value=active), \
             patch.object(self.orchestrator, "process_rows", return_value=http_rows), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={201}):
            self.orchestrator.verify_http_topology()
        with patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "run", return_value=active), \
             patch.object(self.orchestrator, "process_rows", return_value=http_rows), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={201, 999}):
            with self.assertRaisesRegex(RuntimeError, "sole verified PGLite owner"):
                self.orchestrator.verify_http_topology()
        mixed_rows = http_rows + [(202, 1, "bun /home/hermes/.bun/bin/gbrain serve")]
        with patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "run", return_value=active), \
             patch.object(self.orchestrator, "process_rows", return_value=mixed_rows), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={201}):
            with self.assertRaisesRegex(RuntimeError, "sole verified PGLite owner"):
                self.orchestrator.verify_http_topology()
        extra_flag_rows = [(201, 1, "bun /home/hermes/.bun/bin/gbrain serve --http --port 3131 --suppress-bootstrap-token --evil")]
        with patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "run", return_value=active), \
             patch.object(self.orchestrator, "process_rows", return_value=extra_flag_rows), \
             patch.object(self.orchestrator, "process_cmdline", return_value=("bun", *self.orchestrator.HTTP_ARGUMENTS, "--evil")), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={201}):
            with self.assertRaisesRegex(RuntimeError, "sole verified PGLite owner"):
                self.orchestrator.verify_http_topology()
        with patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "run", return_value=active), \
             patch.object(self.orchestrator, "process_rows", return_value=http_rows), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={201}), \
             patch.object(self.orchestrator, "user_service_main_pid", return_value=777):
            with self.assertRaisesRegex(RuntimeError, "sole verified PGLite owner"):
                self.orchestrator.verify_http_topology()
        with patch.object(self.orchestrator, "wait_gateway_health"), \
             patch.object(self.orchestrator, "run", return_value=active), \
             patch.object(self.orchestrator, "process_rows", return_value=http_rows), \
             patch.object(self.orchestrator, "process_executable", return_value="/tmp/bun"), \
             patch.object(self.orchestrator, "pglite_owner_pids", return_value={201}):
            with self.assertRaisesRegex(RuntimeError, "sole verified PGLite owner"):
                self.orchestrator.verify_http_topology()

    def test_rollback_verifies_gateway_health_and_restored_stdio_owner(self):
        with tempfile.TemporaryDirectory() as temp:
            pending = Path(temp) / "pending.json"
            pending.write_text("{}")
            events = []
            with patch.object(self.orchestrator, "PENDING", pending), \
                 patch.object(self.orchestrator, "run", side_effect=lambda args, check=True: events.append(tuple(args)) or subprocess.CompletedProcess(args, 0, stdout="", stderr="")), \
                 patch.object(self.orchestrator, "run_migration", side_effect=lambda phase: events.append(("migration", phase))), \
                 patch.object(self.orchestrator, "wait_gateway_health", side_effect=lambda: events.append(("health",))), \
                 patch.object(self.orchestrator, "user_service_state", return_value="inactive"), \
                 patch.object(self.orchestrator, "verify_restored_stdio_owner", side_effect=lambda: events.append(("stdio-owner",))):
                self.orchestrator.rollback_and_verify()
            self.assertEqual(events[0], ("systemctl", "stop", self.orchestrator.SERVICE))
            self.assertEqual(events[1], ("migration", "rollback"))
            self.assertIn("reset-failed", events[2])
            self.assertEqual(events[3], ("systemctl", "start", self.orchestrator.SERVICE))
            self.assertIn(("health",), events)
            self.assertIn(("stdio-owner",), events)


if __name__ == "__main__":
    unittest.main()
