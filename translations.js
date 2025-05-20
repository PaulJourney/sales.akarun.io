const translations = {
    en: {
        title: "Family & Friends Sale",
        enterPassword: "Enter access password",
        accessSale: "Access Sale",
        networkInfo: "This sale is conducted on Binance Smart Chain (BSC)",
        minMax: "The minimum contribution is $200 and the maximum contribution per wallet is $2,000.",
        paymentInfo: "Payments must be made in USDT (BEP20) on Binance Smart Chain to the following address:",
        selectAmount: "Select Contribution Amount:",
        chooseAmount: "Choose amount...",
        youWillReceive: "You will receive:",
        tokens: "AKA tokens",
        payNow: "PAY NOW with MetaMask (BSC)",
        needHelp: "Need help?",
        makeSure: "Make sure you have:",
        requirement1: "MetaMask installed and connected",
        requirement2: "Switched to Binance Smart Chain network",
        requirement3: "Sufficient USDT (BEP20) balance",
        requirement4: "Some BNB for gas fees"
    },
    it: {
        title: "Vendita Family & Friends",
        enterPassword: "Inserisci la password di accesso",
        accessSale: "Accedi alla Vendita",
        networkInfo: "Questa vendita si svolge su Binance Smart Chain (BSC)",
        minMax: "Il contributo minimo è di $200 e il massimo per wallet è di $2,000.",
        paymentInfo: "I pagamenti devono essere effettuati in USDT (BEP20) su Binance Smart Chain al seguente indirizzo:",
        selectAmount: "Seleziona l'Importo del Contributo:",
        chooseAmount: "Scegli l'importo...",
        youWillReceive: "Riceverai:",
        tokens: "token AKA",
        payNow: "PAGA ORA con MetaMask (BSC)",
        needHelp: "Hai bisogno di aiuto?",
        makeSure: "Assicurati di avere:",
        requirement1: "MetaMask installato e connesso",
        requirement2: "Rete Binance Smart Chain selezionata",
        requirement3: "Saldo USDT (BEP20) sufficiente",
        requirement4: "Un po' di BNB per le fee"
    },
    es: {
        title: "Venta Family & Friends",
        enterPassword: "Ingresa la contraseña de acceso",
        accessSale: "Acceder a la Venta",
        networkInfo: "Esta venta se realiza en Binance Smart Chain (BSC)",
        minMax: "La contribución mínima es de $200 y la máxima por billetera es de $2,000.",
        paymentInfo: "Los pagos deben realizarse en USDT (BEP20) en Binance Smart Chain a la siguiente dirección:",
        selectAmount: "Selecciona el Monto de Contribución:",
        chooseAmount: "Elige el monto...",
        youWillReceive: "Recibirás:",
        tokens: "tokens AKA",
        payNow: "PAGAR AHORA con MetaMask (BSC)",
        needHelp: "¿Necesitas ayuda?",
        makeSure: "Asegúrate de tener:",
        requirement1: "MetaMask instalado y conectado",
        requirement2: "Red Binance Smart Chain seleccionada",
        requirement3: "Saldo USDT (BEP20) suficiente",
        requirement4: "Algo de BNB para las comisiones"
    },
    tr: {
        title: "Aile ve Arkadaşlar Satışı",
        enterPassword: "Erişim şifresini girin",
        accessSale: "Satışa Eriş",
        networkInfo: "Bu satış Binance Smart Chain (BSC) üzerinde gerçekleştirilmektedir",
        minMax: "Minimum katkı $200 ve cüzdan başına maksimum katkı $2,000'dir.",
        paymentInfo: "Ödemeler Binance Smart Chain üzerinde USDT (BEP20) ile aşağıdaki adrese yapılmalıdır:",
        selectAmount: "Katkı Miktarını Seçin:",
        chooseAmount: "Miktar seçin...",
        youWillReceive: "Alacağınız:",
        tokens: "AKA token",
        payNow: "MetaMask ile ŞİMDİ ÖDE (BSC)",
        needHelp: "Yardıma mı ihtiyacınız var?",
        makeSure: "Şunlara sahip olduğunuzdan emin olun:",
        requirement1: "MetaMask kurulu ve bağlı",
        requirement2: "Binance Smart Chain ağı seçili",
        requirement3: "Yeterli USDT (BEP20) bakiyesi",
        requirement4: "İşlem ücretleri için BNB"
    },
    ph: {
        title: "Family & Friends Sale",
        enterPassword: "Ilagay ang access password",
        accessSale: "Access ang Sale",
        networkInfo: "Ang sale na ito ay isinasagawa sa Binance Smart Chain (BSC)",
        minMax: "Ang minimum na kontribusyon ay $200 at ang maximum na kontribusyon bawat wallet ay $2,000.",
        paymentInfo: "Ang mga pagbabayad ay dapat gawin sa USDT (BEP20) sa Binance Smart Chain sa sumusunod na address:",
        selectAmount: "Piliin ang Halaga ng Kontribusyon:",
        chooseAmount: "Pumili ng halaga...",
        youWillReceive: "Makakatanggap ka ng:",
        tokens: "AKA tokens",
        payNow: "MAGBAYAD NGAYON gamit ang MetaMask (BSC)",
        needHelp: "Kailangan ng tulong?",
        makeSure: "Siguraduhing mayroon ka ng:",
        requirement1: "MetaMask na naka-install at konektado",
        requirement2: "Naka-switch sa Binance Smart Chain network",
        requirement3: "Sapat na USDT (BEP20) balance",
        requirement4: "Ilang BNB para sa gas fees"
    }
};

// Funzione per cambiare lingua
function changeLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Salva la lingua selezionata in localStorage
    localStorage.setItem('lang', lang);
}
