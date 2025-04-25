// BSC Configuration
const USDT_CONTRACT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const PAYMENT_ADDRESS = "0x12889B20F20A513E23c47FcEe3E1d8536e49B7c6";
const BSC_CHAIN_ID = "0x38";
const TOKEN_PRICE = 0.005;

// Password protection
const CORRECT_PASSWORD = '$©Ω[€"\'¢ÇÅ$';
const passwordSection = document.getElementById('password-section');
const mainContent = document.getElementById('main-content');
const passwordInput = document.getElementById('password-input');
const submitPassword = document.getElementById('submit-password');
const passwordError = document.getElementById('password-error');

// Purchase elements
const amountSelect = document.getElementById('amount-select');
const tokenDisplay = document.getElementById('token-display');
const tokenAmount = document.getElementById('token-amount');
const payButton = document.getElementById('pay-button');
const transactionStatus = document.getElementById('transaction-status');
const loadingSpinner = document.getElementById('loading-spinner');
const statusMessage = document.getElementById('status-message');
const statusDetails = document.getElementById('status-details');

// Event listeners
submitPassword.addEventListener('click', validatePassword);
amountSelect.addEventListener('change', updateTokenAmount);
payButton.addEventListener('click', initiatePayment);

// Password validation
function validatePassword() {
    if (passwordInput.value === CORRECT_PASSWORD) {
        passwordSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
    } else {
        passwordError.textContent = 'Incorrect password. Please try again.';
        passwordInput.value = '';
    }
}

// Update token amount based on selected USD amount
function updateTokenAmount() {
    const selectedAmount = parseInt(amountSelect.value);
    if (selectedAmount) {
        const tokens = selectedAmount / TOKEN_PRICE;
        tokenDisplay.classList.remove('hidden');
        tokenAmount.textContent = tokens.toLocaleString();
        payButton.disabled = false;
    } else {
        tokenDisplay.classList.add('hidden');
        payButton.disabled = true;
    }
}

// Check if network is BSC
async function checkNetwork() {
    if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask to proceed.");
        return false;
    }

    try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        if (chainId !== BSC_CHAIN_ID) {
            const switched = await switchToBSC();
            return switched;
        }
        return true;
    } catch (error) {
        console.error("Error checking network:", error);
        return false;
    }
}

// Switch to BSC Network
async function switchToBSC() {
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BSC_CHAIN_ID }],
        });
        return true;
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: BSC_CHAIN_ID,
                        chainName: "Binance Smart Chain",
                        nativeCurrency: {
                            name: "BNB",
                            symbol: "BNB",
                            decimals: 18
                        },
                        rpcUrls: ["https://bsc-dataseed.binance.org/"],
                        blockExplorerUrls: ["https://bscscan.com/"]
                    }]
                });
                return true;
            } catch (addError) {
                console.error("Error adding BSC network:", addError);
                return false;
            }
        }
        console.error("Error switching to BSC:", switchError);
        return false;
    }
}

// Initialize payment process
async function initiatePayment() {
    if (!window.ethers) {
        showTransactionError("MetaMask connection error. Please refresh the page and try again.");
        console.error("Ethers library not loaded");
        return;
    }

    if (!await checkNetwork()) return;
    if (!amountSelect.value) {
        alert('Please select an amount before proceeding.');
        return;
    }

    showTransactionStatus('Initializing transaction...', '', true);
    payButton.disabled = true;

    try {
        // 1. Get user's address and verify MetaMask connection
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        console.log('Connected wallet address:', userAddress);
        
        if (userAddress.toLowerCase() === PAYMENT_ADDRESS.toLowerCase()) {
            showTransactionError("Cannot send from the payment address. Please use a different wallet.");
            return;
        }

        // 2. Setup provider and contract
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Verify we're on BSC
        const network = await provider.getNetwork();
        console.log('Current network:', network);
        if (network.chainId !== parseInt(BSC_CHAIN_ID)) {
            showTransactionError("Please switch to Binance Smart Chain network");
            return;
        }

        // 3. Setup USDT contract with full ABI
        const usdtAbi = [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)",
            "function balanceOf(address) view returns (uint256)",
            "function transfer(address to, uint256 value) returns (bool)",
            "function approve(address spender, uint256 value) returns (bool)",
            "event Transfer(address indexed from, address indexed to, uint256 value)"
        ];

        const usdtContract = new ethers.Contract(
            USDT_CONTRACT_ADDRESS,
            usdtAbi,
            signer
        );

        // 4. Verify USDT contract
        try {
            const tokenName = await usdtContract.name();
            const tokenSymbol = await usdtContract.symbol();
            const tokenDecimals = await usdtContract.decimals();
            console.log('Token details:', {
                name: tokenName,
                symbol: tokenSymbol,
                decimals: tokenDecimals,
                address: USDT_CONTRACT_ADDRESS
            });
        } catch (error) {
            console.error('Error verifying USDT contract:', error);
            showTransactionError("Error verifying USDT contract. Please make sure you're on BSC network.");
            return;
        }

        // 5. Check balances
        const userBalance = await usdtContract.balanceOf(userAddress);
        const amount = ethers.utils.parseUnits(amountSelect.value, 6);
        
        console.log('Transaction details:', {
            from: userAddress,
            to: PAYMENT_ADDRESS,
            amount: amountSelect.value,
            amountWei: amount.toString(),
            userBalance: ethers.utils.formatUnits(userBalance, 6)
        });

        if (userBalance.lt(amount)) {
            showTransactionError(`Insufficient USDT balance. You have ${ethers.utils.formatUnits(userBalance, 6)} USDT but trying to send ${amountSelect.value} USDT`);
            return;
        }

        // 6. Estimate gas before sending transaction
        try {
            const gasEstimate = await usdtContract.estimateGas.transfer(PAYMENT_ADDRESS, amount);
            console.log('Estimated gas:', gasEstimate.toString());
        } catch (gasError) {
            console.error('Gas estimation error:', gasError);
            showTransactionError("Error estimating gas. Please make sure you have enough BNB for fees.");
            return;
        }

        // 7. Send transaction
        showTransactionStatus('Waiting for transaction confirmation...', '', true);
        
        const tx = await usdtContract.transfer(PAYMENT_ADDRESS, amount, {
            gasLimit: 100000 // Set a reasonable gas limit
        });
        
        console.log('Transaction sent:', tx.hash);
        showTransactionStatus('Transaction submitted! Waiting for confirmation...', `Transaction hash: ${tx.hash}`, true);
        
        // 8. Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
        if (receipt.status === 1) {
            showTransactionSuccess();
        } else {
            showTransactionError("Transaction failed. Please check BSCscan for details.");
        }

    } catch (error) {
        console.error('Transaction error:', error);
        
        let errorMessage = 'Transaction failed. ';
        
        if (error.code === 4001) {
            errorMessage += 'You rejected the transaction.';
        } else if (error.code === -32603) {
            errorMessage += 'Insufficient USDT balance.';
        } else if (error.message && error.message.includes('user rejected')) {
            errorMessage += 'You rejected the transaction.';
        } else if (error.message && error.message.includes('insufficient funds')) {
            errorMessage += 'Insufficient BNB for gas fees.';
        } else if (error.message && error.message.includes('exceeds balance')) {
            errorMessage += 'Insufficient USDT balance.';
        } else {
            errorMessage += 'Please make sure you have enough USDT and BNB for gas fees. Error: ' + error.message;
        }
        
        showTransactionError(errorMessage);
        payButton.disabled = false;
    }
}

function showTransactionStatus(message, details = '', loading = false) {
    transactionStatus.classList.remove('hidden');
    statusMessage.textContent = message;
    statusDetails.textContent = details;
    loadingSpinner.classList.toggle('hidden', !loading);
}

function showTransactionSuccess() {
    showTransactionStatus(
        '🎉 Congratulations! Transaction successfully completed.',
        'Your wallet has been successfully included in the Family & Friends Sale.\n' +
        'On TGE day, you will receive 10% of your tokens immediately.\n' +
        'The remaining 90% will be released monthly over the next 4 months (vesting).',
        false
    );
    statusMessage.style.color = 'var(--success-color)';
}

function showTransactionError(message) {
    showTransactionStatus('⚠️ Transaction failed. Please try again.', message, false);
    statusMessage.style.color = 'var(--error-color)';
    payButton.disabled = false;
}

// Funzione per cambiare lingua
function changeLanguage(lang) {
    if (!translations || !translations[lang]) {
        console.error('Translations not found for language:', lang);
        return;
    }

    // Salva la lingua selezionata
    localStorage.setItem('selectedLanguage', lang);
    
    // Aggiorna la classe active sul selettore della lingua
    document.querySelectorAll('.language-selector a').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-lang') === lang) {
            el.classList.add('active');
        }
    });

    // Aggiorna tutti gli elementi con attributo data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (element.tagName === 'OPTION') {
                element.textContent = translations[lang][key];
            } else {
                element.innerHTML = translations[lang][key];
            }
        }
    });

    // Aggiorna i placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Aggiorna il titolo della pagina
    document.title = `Akarun Token - ${translations[lang].title}`;
}

// Aggiungi event listener per i link delle lingue
document.querySelectorAll('.language-selector a').forEach(el => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = e.target.getAttribute('data-lang');
        changeLanguage(lang);
    });
});

// Imposta la lingua iniziale quando il DOM è completamente caricato
window.addEventListener('DOMContentLoaded', () => {
    // Verifica che le traduzioni siano disponibili
    if (typeof translations === 'undefined') {
        console.error('Translations not loaded!');
        return;
    }

    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    changeLanguage(savedLang);
});
