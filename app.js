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
    if (!await checkNetwork()) return;
    if (!amountSelect.value) {
        alert('Please select an amount before proceeding.');
        return;
    }

    showTransactionStatus('Waiting for transaction confirmation...', '', true);
    payButton.disabled = true;

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const usdtContract = new ethers.Contract(
            USDT_CONTRACT_ADDRESS,
            ['function transfer(address to, uint256 value) returns (bool)'],
            signer
        );

        const amount = ethers.utils.parseUnits(amountSelect.value, 18);
        const tx = await usdtContract.transfer(PAYMENT_ADDRESS, amount);
        await tx.wait();

        showTransactionSuccess();
    } catch (error) {
        console.error('Transaction failed:', error);
        showTransactionError();
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

function showTransactionError() {
    showTransactionStatus('⚠️ Transaction failed. Please try again.', '', false);
    statusMessage.style.color = 'var(--error-color)';
    payButton.disabled = false;
}
