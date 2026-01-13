# Set UTF-8 encoding for PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:LANG = 'en_US.UTF-8'

# Run Playwright tests
npx playwright test --reporter=list
