# Define the domain names and their webroot paths
$domains = @{
    "blaster.ddns.net" = "C:\wamp64\www"
    "droid7.ddns.net" = "C:\wamp64\www\droid7\webhook-message\droid7"
    "mixitup-endpoint.ddns.net" = "C:\wamp64\www\mixitup-endpoint"
}

# Get the current script directory
$currentDir = Get-Location

# Define the path to the Certbot executable
$certbotPath = "C:\wamp64\www\droid7\webhook-message\.venv\Scripts\certbot.exe"
$email = "newsithempire1@gmail.com"

# Loop through each domain to request certificates
foreach ($domain in $domains.Keys) {
    $webrootPath = $domains[$domain]
    
    # Create the domain directory in the current directory
    $certDir = Join-Path -Path $currentDir -ChildPath $domain

    # Create the directory if it does not exist
    if (-Not (Test-Path -Path $certDir)) {
        New-Item -ItemType Directory -Path $certDir
    }

    # Define paths for the obtained certificate and private key
    $fullchainSource = "C:\certbot\live\$domain\fullchain.pem"
    $privkeySource = "C:\certbot\live\$domain\privkey.pem"

    # Check if both the certificate and private key already exist
    $certExists = Test-Path $fullchainSource
    $keyExists = Test-Path $privkeySource

    if ($certExists -and $keyExists) {
        Write-Host "Certificate for $domain already exists."
    } else {
        # Build the Certbot command as a single string
        $command = "$certbotPath certonly --webroot --email $email --agree-tos --no-eff-email --webroot-path $webrootPath -d $domain > C:\Certbot\log\$domain-certbot-output.log 2>&1"

        Invoke-Expression $command

        # Check if both the certificate files were generated
        $certExists = Test-Path $fullchainSource
        $keyExists = Test-Path $privkeySource

        if ($certExists -and $keyExists) {
            Write-Host "Certificate for $domain obtained."
        } else {
            Write-Host "Error: Certificate for $domain could not be obtained."
        }
    }

    # Create symbolic links to the certificate and private key in the domain's directory
    $crtLink = Join-Path -Path $certDir -ChildPath "certificate.crt"
    $keyLink = Join-Path -Path $certDir -ChildPath "private.key"

    # Create symbolic links if source files exist
    if ($certExists -and $keyExists) {
        New-Item -ItemType SymbolicLink -Path $crtLink -Target $fullchainSource -Force
        New-Item -ItemType SymbolicLink -Path $keyLink -Target $privkeySource -Force
        Write-Host "Symbolic links created for $domain."
    } else {
        Write-Host "Warning: Source files for $domain do not exist. Cannot create symbolic links."
    }
}

Write-Host "All certificates processed."
