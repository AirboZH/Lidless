Set-Location "X:\Lidless"
python scripts\capture_audit.py 2>&1 | Tee-Object -FilePath "scripts\audit_output.txt"
Write-Host "Done. Output saved to scripts\audit_output.txt"
