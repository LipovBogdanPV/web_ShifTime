const API_URL = "https://script.google.com/macros/s/AKfycbz4ASL96hpxGcLn_A29--aUGyCfWjCuLZ_xNOFs_Q1mplJNaWm9oemfOSZ5ackS424u/exec";
let allData = [];
let selectedCategory = "";
let selectedSubcategory = "";
let selectedSize = "";
let selectedProductPrice = 0;

fetch(API_URL)
.then(res => res.json())
.then(data => {
    allData = data;
    const categories = [...new Set(data.map(d => d["Категорія"]).filter(Boolean))];
    const block = document.getElementById("category-block");
    categories.forEach(c => {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary m-1";
        btn.textContent = c;
        btn.addEventListener("click", () => selectCategory(c));
        block.appendChild(btn);
    });
});

function selectCategory(category) {
    selectedCategory = category;
    selectedSubcategory = "";
    selectedSize = "";
    selectedProductPrice = 0;

    document.getElementById("subcategory-block").classList.add("d-none");
    document.getElementById("size-block").classList.add("d-none");
    document.getElementById("accessories-block").classList.add("d-none");
    document.getElementById("engraving-block").classList.add("d-none");
    document.getElementById("order-block").classList.add("d-none");

    const filtered = allData.filter(d => d["Категорія"] === category);
    const subcategories = [...new Set(filtered.map(d => d["Підкатегорія"]).filter(Boolean))];

    const block = document.getElementById("subcategory-block");
    block.innerHTML = "";
    subcategories.forEach(sc => {
        const btn = document.createElement("button");
        btn.className = "btn btn-secondary m-1";
        btn.textContent = sc;
        btn.addEventListener("click", () => selectSubcategory(sc));
        block.appendChild(btn);
    });
    block.classList.remove("d-none");
}

function selectSubcategory(subcategory) {
    selectedSubcategory = subcategory;
    selectedSize = "";
    selectedProductPrice = 0;

    document.getElementById("size-block").classList.add("d-none");
    document.getElementById("accessories-block").classList.add("d-none");
    document.getElementById("engraving-block").classList.add("d-none");
    document.getElementById("order-block").classList.add("d-none");

    const filtered = allData.filter(d => d["Категорія"] === selectedCategory && d["Підкатегорія"] === subcategory);
    const sizes = [...new Set(filtered.map(d => d["Розмір"]).filter(Boolean))];

    const block = document.getElementById("size-block");
    block.innerHTML = "";
    sizes.forEach(size => {
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-primary m-1";
        btn.textContent = size;
        btn.addEventListener("click", () => selectSize(size));
        block.appendChild(btn);
    });
    block.classList.remove("d-none");
}

function selectSize(size) {
    selectedSize = size;
    document.getElementById("accessories-block").classList.add("d-none");
    document.getElementById("engraving-block").classList.add("d-none");
    document.getElementById("order-block").classList.add("d-none");

    const product = allData.find(d =>
        d["Категорія"] === selectedCategory &&
        d["Підкатегорія"] === selectedSubcategory &&
        String(d["Розмір"]) === String(size)
    );

    if (!product) return;
    selectedProductPrice = Number(product["Вартість"]) || 0;

    if (!product["Аксесуари Товару"]) return;

    // ✅ Автоматично формуємо список allowedAccessories аксесуари 
    const allAccessories = allData
    .map(d => d["Аксесуари Товару"])
    .filter(Boolean)
    .flatMap(a => a.split("/").map(x => x.trim()))
    .filter(Boolean);

    const allowedAccessories = [...new Set(allAccessories)];// унікальне значення, масив який формується з стовпчика аксесуари товарів

    const accessories = product["Аксесуари Товару"]
    .split("/")
    .map(a => a.trim())
    .filter(Boolean);

    const list = document.getElementById("accessories-list");
    list.innerHTML = "";

    accessories
        .filter(acc => allowedAccessories.some(a => acc.toLowerCase().includes(a.toLowerCase())))
        .forEach(item => {
            const li = document.createElement("li");
            li.className = "list-group-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input me-2";
            checkbox.value = item;

            const accData = allData.find(d =>
                d["Аксесуари Категорії"] === "АКСЕСУАРИ" &&
                d["Підкатегорія"]&&
                d["Підкатегорія"].toLowerCase().includes(item.toLowerCase()) &&
                String(d["Розмір"]) === String(size)
                );
            checkbox.dataset.price = accData ? accData["Вартість"] : 0;

            checkbox.addEventListener("change", () => {
                updateOrderSummary();
                toggleEngravingBlock();
            });

            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(`${item} (+${checkbox.dataset.price} грн)`));
            list.appendChild(li);
        });

    document.getElementById("selected-size").textContent = size;
    document.getElementById("accessories-block").classList.remove("d-none");

    updateOrderSummary();
}

function toggleEngravingBlock() {
    const engravingChecked = Array.from(document.querySelectorAll('#accessories-list input:checked'))
        .some(cb => cb.value.toLowerCase().includes("гравіювання"));
    document.getElementById("engraving-block").classList.toggle("d-none", !engravingChecked);
}

function updateOrderSummary() {
    if (!selectedSize) {
        document.getElementById("order-block").classList.add("d-none");
        return;
    }

    let totalPrice = selectedProductPrice;
    let orderText = `ЗАМОВЛЕННЯ №b-113\n`;
    orderText += `* * * * * * * * * * * * * *\n`;
    orderText += `${selectedSubcategory} d${selectedSize}\n`;

    const checkedAccessories = Array.from(document.querySelectorAll('#accessories-list input:checked'))
    .map(cb => {
        totalPrice += Number(cb.dataset.price)
        return `${cb.value} d${selectedSize}`;
    });

    checkedAccessories.forEach(acc => {
        orderText += `\n${acc}`;
    });

    const engravingText = document.getElementById("engraving-text").value.trim();
    if (engravingText) {
        orderText += `\nТекст гравіювання: ${engravingText}`;
    }

    orderText += `\nЦіна для клієнта ${totalPrice} грн\n(наложка)\n`;
    orderText += `* * * * * * * * * * * * * *`;

    document.getElementById("order-summary").textContent = orderText;
    document.getElementById("order-block").classList.remove("d-none");
}

    // Оновлювати підсумок при зміні тексту гравіювання
    document.getElementById("engraving-text").addEventListener("input", updateOrderSummary);

document.getElementById("submit-order").addEventListener("click", () => {
    const summary = document.getElementById("order-summary").textContent;
    localStorage.setItem("orderSummary", summary);
    window.location.href = "client_form.html";
});
