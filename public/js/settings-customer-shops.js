/* Settings: Customer Shop Information — customer_shops table */

let customerShops = [];
let editingCustomerShopId = null;
let customerShopsRealtimeReady = false;

function escCustomerShopHtml(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function normalizeShopUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return "https://" + raw;
}

function renderCustomerShopsList() {
  const el = document.getElementById("customer-shops-list");
  if (!el) return;

  if (!customerShops.length) {
    el.innerHTML = `<div class="intake-empty">${tr("shops_empty") || "No customer shops yet."}</div>`;
    return;
  }

  el.innerHTML = customerShops
    .map((shop) => {
      const url = normalizeShopUrl(shop.shop_url);
      const safeUrl = escCustomerShopHtml(url);
      const id = escCustomerShopHtml(shop.id);
      return `<div class="svc-item customer-shop-item">
      <div class="customer-shop-main">
        <div class="svc-name">${escCustomerShopHtml(shop.shop_name)}</div>
        <a class="customer-shop-url" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>
      </div>
      <div class="customer-shop-actions">
        <a class="btn btn-sm btn-p" href="${safeUrl}" target="_blank" rel="noopener noreferrer" title="${tr("shop_open") || "Open"}">
          <i class="ti ti-external-link"></i><span>${tr("shop_open") || "Open"}</span>
        </a>
        <button class="btn btn-sm" type="button" onclick="openCustomerShopModal('${id}')"><i class="ti ti-edit"></i></button>
        <button class="btn btn-sm btn-ghost" type="button" onclick="removeCustomerShop('${id}')"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
    })
    .join("");
}

function openCustomerShopModal(id) {
  editingCustomerShopId = id || null;
  const shop = id ? customerShops.find((s) => s.id === id) : null;
  const titleEl = document.getElementById("customer-shop-modal-title");
  if (titleEl) {
    titleEl.textContent = shop
      ? tr("edit_shop") || "Edit Shop"
      : tr("add_shop") || "Add Shop";
  }
  document.getElementById("customer-shop-name").value = shop?.shop_name || "";
  document.getElementById("customer-shop-url").value = shop?.shop_url || "";
  openModal("customer-shop");
}

function cancelCustomerShopModal() {
  editingCustomerShopId = null;
  closeModal("customer-shop");
}

async function saveCustomerShopModal() {
  const shop_name = document.getElementById("customer-shop-name").value.trim();
  let shop_url = document.getElementById("customer-shop-url").value.trim();
  if (!shop_name) {
    document.getElementById("customer-shop-name").focus();
    return;
  }
  if (!shop_url) {
    document.getElementById("customer-shop-url").focus();
    return;
  }
  shop_url = normalizeShopUrl(shop_url);
  if (!sb) {
    alert("Supabase not connected");
    return;
  }

  try {
    if (editingCustomerShopId) {
      const { error } = await sb
        .from("customer_shops")
        .update({ shop_name, shop_url })
        .eq("id", editingCustomerShopId);
      if (error) throw error;
    } else {
      const { error } = await sb
        .from("customer_shops")
        .insert({ shop_name, shop_url });
      if (error) throw error;
    }
    cancelCustomerShopModal();
    await loadCustomerShops();
    if (typeof showSetMsg === "function") {
      showSetMsg("customer-shops-save-msg", tr("saved") || "Saved");
    }
  } catch (e) {
    console.error(e);
    alert((tr("error") || "Error") + ": " + (e.message || e));
  }
}

async function removeCustomerShop(id) {
  const shop = customerShops.find((s) => s.id === id);
  if (!shop) return;
  if (!confirm(tr("remove_shop_confirm") || "Remove this shop?")) return;
  if (!sb) return;
  try {
    const { error } = await sb.from("customer_shops").delete().eq("id", id);
    if (error) throw error;
    await loadCustomerShops();
  } catch (e) {
    console.error(e);
    alert((tr("error") || "Error") + ": " + (e.message || e));
  }
}

async function loadCustomerShops() {
  if (!sb) {
    customerShops = [];
    renderCustomerShopsList();
    return;
  }
  try {
    const { data, error } = await sb
      .from("customer_shops")
      .select("id,shop_name,shop_url,created_at")
      .order("shop_name", { ascending: true });
    if (error) throw error;
    customerShops = data || [];
    renderCustomerShopsList();
  } catch (e) {
    console.error("loadCustomerShops:", e);
    customerShops = [];
    renderCustomerShopsList();
  }
}

function loadCustomerShopsSection(id) {
  if (id === "shop") loadCustomerShops();
}

function setupCustomerShopsRealtime() {
  if (!sb || customerShopsRealtimeReady) return;
  customerShopsRealtimeReady = true;
  sb.channel("set-customer-shops")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "customer_shops" },
      () => loadCustomerShops(),
    )
    .subscribe();
}
