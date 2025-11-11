// === app.js — versão unificada e otimizada ===
// Gerencia catálogo, produto, carrinho e checkout com base no localStorage (carrinho_v3)

async function carregarProdutos() {
  const res = await fetch("data/products.json");
  return await res.json();
}

function moedaBR(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/* ==== CARRINHO ==== */
function getCarrinho() {
  return JSON.parse(localStorage.getItem("carrinho_v2") || "[]");
}
function salvarCarrinho(carrinho) {
  localStorage.setItem("carrinho_v2", JSON.stringify(carrinho));
}
function atualizarBadge() {
  const qty = getCarrinho().reduce((s, i) => s + i.qty, 0);
  document
    .querySelectorAll("#cart-qty, #cart-qty-2, #cart-qty-3")
    .forEach((e) => {
      if (e) e.textContent = qty;
    });
}
function adicionarCarrinhoID(id, qty = 1) {
  const carrinho = getCarrinho();
  const item = carrinho.find((x) => x.id == id);
  if (item) item.qty += qty;
  else carrinho.push({ id, qty });
  salvarCarrinho(carrinho);
  atualizarBadge();
  alert("Produto adicionado ao carrinho!");
}
function updateQty(id, delta) {
  const carrinho = getCarrinho();
  const item = carrinho.find((x) => x.id == id);
  if (!item) return;
  item.qty = Math.max(0, item.qty + delta);
  if (item.qty === 0) carrinho.splice(carrinho.indexOf(item), 1);
  salvarCarrinho(carrinho);
  location.reload();
}
function removeItem(id) {
  salvarCarrinho(getCarrinho().filter((x) => x.id != id));
  location.reload();
}

/* ==== PÁGINA INICIAL / CATÁLOGO ==== */
if (document.getElementById("destaques-container")) {
  carregarProdutos().then((produtos) => {
    const container = document.getElementById("destaques-container");
    produtos.slice(0, 4).forEach((p) => {
      container.innerHTML += `
        <div class="card">
          <img src="${p.imagem}" alt="${p.nome}">
          <h3>${p.nome}</h3>
          <p>${moedaBR(p.preco)}</p>
          <a class="btn" href="product.html?id=${p.id}">Ver Produto</a>
        </div>`;
    });
    atualizarBadge();
  });
}

if (document.getElementById("catalogo-container")) {
  carregarProdutos().then((produtos) => {
    const container = document.getElementById("catalogo-container");
    const busca = document.getElementById("busca");
    const filtro = document.getElementById("filtro");

    function render(lista) {
      container.innerHTML = "";
      if (!lista.length)
        return (container.innerHTML = "<p>Nenhum produto encontrado</p>");
      lista.forEach((p) => {
        container.innerHTML += `
          <article class="card">
            <img src="${p.imagem}" alt="${p.nome}">
            <h3>${p.nome}</h3>
            <p>${moedaBR(p.preco)}</p>
            <div>
              <button class="btn" onclick="adicionarCarrinhoID(${
                p.id
              },1)">Adicionar</button>
              <a class="btn ghost" href="product.html?id=${p.id}">Detalhes</a>
            </div>
          </article>`;
      });
    }

    render(produtos);
    busca.addEventListener("input", () => {
      const termo = busca.value.trim().toLowerCase();
      const filtrados = produtos.filter((p) =>
        (p.nome + " " + (p.categoria || "")).toLowerCase().includes(termo)
      );
      render(filtrados);
    });
    filtro.addEventListener("change", () => {
      const cat = filtro.value;
      render(cat ? produtos.filter((p) => p.categoria === cat) : produtos);
    });
    atualizarBadge();
  });
}

/* ==== PÁGINA DE PRODUTO ==== */
if (document.getElementById("produto-detalhe")) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  carregarProdutos().then((produtos) => {
    const p = produtos.find((x) => String(x.id) === String(id));
    const detalhe = document.getElementById("produto-detalhe");
    if (!p) return (detalhe.innerHTML = "<p>Produto não encontrado</p>");
    detalhe.innerHTML = `
      <img src="${p.imagem}" alt="${p.nome}">
      <div>
        <h2>${p.nome}</h2>
        <p class="muted">${p.codigo || ""}</p>
        <p>${p.descricao}</p>
        <p><strong>${moedaBR(p.preco)}</strong></p>
        <label>Quantidade:
          <input id="qty-input" type="number" min="1" value="1" style="width:70px;padding:6px;border-radius:6px;border:1px solid #ddd">
        </label>
        <div style="margin-top:12px">
          <button class="btn" id="add-cart-btn">Adicionar ao Carrinho</button>
        </div>
      </div>`;
    document.getElementById("add-cart-btn").addEventListener("click", () => {
      const q = parseInt(document.getElementById("qty-input").value) || 1;
      adicionarCarrinhoID(p.id, q);
    });
    atualizarBadge();
  });
}

/* ==== PÁGINA DO CARRINHO ==== */
if (document.getElementById("carrinho-container")) {
  carregarProdutos().then((produtos) => {
    const carrinho = getCarrinho();
    const container = document.getElementById("carrinho-container");
    if (!carrinho.length) {
      container.innerHTML = "<p>Seu carrinho está vazio.</p>";
      return atualizarBadge();
    }

    let total = 0;
    container.innerHTML = "";
    carrinho.forEach((item) => {
      const p = produtos.find((x) => x.id == item.id);
      const subtotal = p.preco * item.qty;
      total += subtotal;
      container.innerHTML += `
        <div class="cart-item">
          <img src="${p.imagem}" alt="${p.nome}">
          <div class="meta">
            <strong>${p.nome}</strong>
            <div class="muted">${moedaBR(p.preco)}</div>
          </div>
          <div class="qty">
            <button onclick="updateQty(${p.id}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty(${p.id}, 1)">+</button>
          </div>
          <div style="width:110px;text-align:right">
            <div>${moedaBR(subtotal)}</div>
            <button class="btn ghost" onclick="removeItem(${
              p.id
            })">Remover</button>
          </div>
        </div>`;
    });
    container.innerHTML += `<h3>Total: ${moedaBR(total)}</h3>`;
    atualizarBadge();
  });
}

/* ==== CHECKOUT ==== */
if (document.getElementById("checkout-form")) {
  const form = document.getElementById("checkout-form");
  const resumo = document.getElementById("checkout-summary-content");
  const mensagem = document.getElementById("mensagem");

  carregarProdutos().then((produtos) => {
    const carrinho = getCarrinho();
    if (!carrinho.length)
      return (resumo.innerHTML = "<p>Seu carrinho está vazio.</p>");

    let total = 0;
    let html = `<ul class="checkout-items">`;
    carrinho.forEach((item) => {
      const p = produtos.find((x) => x.id == item.id);
      const subtotal = p.preco * item.qty;
      total += subtotal;
      html += `
        <li class="checkout-item">
          <div>
            <strong>${p.nome}</strong><br>
            <small>Qtd: ${item.qty}</small>
          </div>
          <span>${moedaBR(subtotal)}</span>
        </li>`;
    });
    html += `</ul><p class="checkout-total"><strong>Total: ${moedaBR(
      total
    )}</strong></p>`;
    resumo.innerHTML = html;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    mensagem.innerHTML = `<div class="msg-loading">Processando pedido...</div>`;
    setTimeout(() => {
      mensagem.innerHTML = `
        <div class="msg-sucesso">
          <div class="checkmark">
            <span class="checkmark-circle"></span>
            <span class="checkmark-stem"></span>
            <span class="checkmark-kick"></span>
          </div>
          <p> Pedido confirmado com sucesso!</p>
        </div>`;
      localStorage.removeItem("carrinho_v2");
      atualizarBadge();
      form.reset();
      resumo.innerHTML = "<p>Seu carrinho está vazio.</p>";
      setTimeout(() => (mensagem.innerHTML = ""), 6000);
    }, 1500);
  });
}

/* ==== MENU RESPONSIVO ==== */
document.addEventListener("DOMContentLoaded", () => {
  atualizarBadge();
  const toggleBtn = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggleBtn && nav) {
    toggleBtn.addEventListener("click", () => nav.classList.toggle("open"));
  }
});

/* ==== Funções Globais ==== */
window.adicionarCarrinhoID = adicionarCarrinhoID;
window.updateQty = updateQty;
window.removeItem = removeItem;
