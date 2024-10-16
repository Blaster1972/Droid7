# Define the domain names and their respective directories
$domains = @{
    "blaster" = "C:\wamp64\www\Droid7\webhook-message\certs\blaster.ddns.net"
    "droid7" = "C:\wamp64\www\Droid7\webhook-message\certs\droid7.ddns.net"
    "mixitup" = "C:\wamp64\www\Droid7\webhook-message\certs\mixitup-endpoint.ddns.net"
}

# Certificate settings
$password = "droid7"  # Change this to your desired password
$validityYears = 5           # Certificate validity period
$keyLength = 2048            # Key length
$friendlyNameSuffix = "Self-Signed Certificate"  # Friendly name suffix
$certStoreLocation = "cert:\LocalMachine\My"     # Certificate store location
$opensslPath = "C:\wamp64\bin\apache\apache2.4.59\bin\openssl.exe"  # Update this with the path to your OpenSSL executable

# Loop through each domain to create directories and generate certificates
foreach ($domain in $domains.Keys) {
    # Create the directory if it does not exist
    $certDir = $domains[$domain]
    if (-Not (Test-Path -Path $certDir)) {
        New-Item -ItemType Directory -Path $certDir
    }

    # Generate the self-signed certificate
    $cert = New-SelfSignedCertificate -DnsName "$domain.ddns.net" `
                                       -CertStoreLocation $certStoreLocation `
                                       -KeyExportPolicy Exportable `
                                       -NotAfter (Get-Date).AddYears($validityYears) `
                                       -KeyLength $keyLength `
                                       -FriendlyName "$domain.ddns.net - $friendlyNameSuffix"
    
    # Export the certificate to a PFX file
    $pfxPath = Join-Path -Path $certDir -ChildPath "certificate.pfx"
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password (ConvertTo-SecureString -String $password -Force -AsPlainText)

    # Output the path of the exported certificate
    Write-Host "Certificate for $domain.ddns.net created at: $pfxPath"

    # Define paths for extracted files
    $crtPath = Join-Path -Path $certDir -ChildPath "certificate.crt"
    $keyPath = Join-Path -Path $certDir -ChildPath "private.key"

    # Extract certificate
    & $opensslPath pkcs12 -in $pfxPath -clcerts -nokeys -out $crtPath -passin pass:$password

    # Extract private key WITHOUT a passphrase
    & $opensslPath pkcs12 -in $pfxPath -nocerts -out $keyPath -passin pass:$password -nodes
}

Write-Host "All certificates and their keys have been created and extracted without a passphrase."
