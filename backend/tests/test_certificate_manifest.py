import json
from pathlib import Path

import pytest

from app.modules.content.certificates import load_certificate_specs


def test_manifest_is_explicit_and_missing_input_fails_safely(tmp_path):
    with pytest.raises(ValueError, match="Private"):
        load_certificate_specs(tmp_path / "missing.json")


def test_committed_manifest_contains_only_anonymous_samples():
    specs = load_certificate_specs(Path("app/modules/content/certificate-import.example.json"))
    assert len(specs) == 5
    assert all(spec["student_name"].startswith("NAMUNA") for spec in specs)


@pytest.mark.parametrize("value", [[], [{"type": "ielts"}] * 5])
def test_invalid_manifest_fails_before_import(tmp_path, value):
    manifest = tmp_path / "manifest.json"
    manifest.write_text(json.dumps(value))
    with pytest.raises(ValueError, match="3 IELTS"):
        load_certificate_specs(manifest)
