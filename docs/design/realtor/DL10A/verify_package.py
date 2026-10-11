"""Read-only package validation. --manifest writes only the local member inventory."""
import hashlib
from pathlib import Path, PurePosixPath
import sys
import zipfile

ROOT = Path(__file__).resolve().parent
DIGEST = "c883e9b226ce59831afb22d0922914a4cb64855684cb636683a727c8358ef311"
PREFIX = "Nadakki_Realtor_OS_DL10A_FINAL_GATE/"
REPORTS = ["DL10A_FINAL_GATE_REPORT.md", "MATRIZ_CONTRACTUAL_DL10A.md",
           "LIMITACIONES_DL10A.md", "PRUEBA_MANUAL_DL10A.md"]

def check_digest(data):
    if hashlib.sha256(data).hexdigest() != DIGEST:
        raise ValueError("Official ZIP digest mismatch")

def main():
    data = (ROOT / "Nadakki_Realtor_OS_DL10A_FINAL_GATE.zip").read_bytes()
    check_digest(data)
    try:
        check_digest(b"synthetic invalid archive")
    except ValueError:
        pass
    else:
        raise AssertionError("Negative digest test did not reject")
    with zipfile.ZipFile(ROOT / "Nadakki_Realtor_OS_DL10A_FINAL_GATE.zip") as archive:
        assert archive.testzip() is None, "Invalid CRC"
        names = archive.namelist()
        assert len(names) == len(set(names)), "Duplicate member"
        assert all(not PurePosixPath(n).is_absolute() and ".." not in PurePosixPath(n).parts and "\\" not in n for n in names), "Unsafe member"
        for report in REPORTS:
            assert (ROOT / report).read_text(encoding="utf-8") == archive.read(PREFIX + report).decode("utf-8").replace("\r\n", "\n"), report
        assert "DESIGN_APPROVED: NO" in archive.read(PREFIX + REPORTS[0]).decode("utf-8")
        inventory = "".join(hashlib.sha256(archive.read(n)).hexdigest() + "  " + n + "\n" for n in sorted(names) if not n.endswith("/"))
        manifest = ROOT / "MEMBERS.sha256"
        if sys.argv[1:] == ["--manifest"]:
            manifest.write_text(inventory, encoding="utf-8", newline="\n")
        else:
            assert not sys.argv[1:]
            assert manifest.read_text(encoding="utf-8") == inventory, "Inventory mismatch"
        print(f"PASS: official SHA256, CRC, {len(names)} members, 4 reports, negative digest, design status, inventory")

if __name__ == "__main__":
    main()
