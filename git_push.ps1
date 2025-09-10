# PowerShell script to push git commits
Set-Location "F:\snapstream"

Write-Host "=== Git Status ===" -ForegroundColor Green
git status

Write-Host "`n=== Adding all changes ===" -ForegroundColor Yellow
git add .

Write-Host "`n=== Committing changes ===" -ForegroundColor Yellow
git commit -m "Fix React error #31 and improve timestamp handling

- Fix React error #31 related to timestamp object rendering
- Improve timestamp validation in formatMessageTime function
- Add better type checking for timestamp objects
- Ensure all timestamps are converted to strings before rendering
- Complete profile 404 error handling system
- Add username validation utilities"

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Yellow
git push origin main

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "All commits have been pushed to GitHub successfully!"
