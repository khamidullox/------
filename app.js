var SUPA_URL = "https://zzfqisdtxgcvdnnqfrym.supabase.co";
var SUPA_KEY = "sb_publishable_kQNelOL1x8_LvnWTEp5bOA_SBGVMI1y";
var currentDevId = null;

// URL dan ID ni avtomatik o'qish
window.addEventListener("load", function () {
  var params = new URLSearchParams(window.location.search);
  var urlId = params.get("id");
  if (urlId) {
    document.getElementById("s-id").value = urlId.toUpperCase();
    document.querySelectorAll(".page").forEach(function (x) {
      x.classList.remove("active");
    });
    document.querySelectorAll(".nav button").forEach(function (x) {
      x.classList.remove("active");
    });
    document.getElementById("page-skaaner").classList.add("active");
    document.querySelectorAll(".nav button")[1].classList.add("active");
    scanDev();
  }
});

function supaFetch(path, method, body) {
  var opts = {
    method: method || "GET",
    headers: {
      apikey: SUPA_KEY,
      Authorization: "Bearer " + SUPA_KEY,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : "",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(SUPA_URL + "/rest/v1/" + path, opts).then(function (r) {
    if (!r.ok)
      return r.text().then(function (t) {
        throw new Error(t);
      });
    return r.json().catch(function () {
      return {};
    });
  });
}

function statusBadge(s) {
  if (s === "ok")
    return '<span class="badge badge-ok">✅ Ишлаяпти</span>';
  if (s === "bad")
    return '<span class="badge badge-bad">❌ Бузилган</span>';
  if (s === "qabul")
    return '<span class="badge" style="background:#e8f0fe;color:#1a56db">📥 Қабул қилинди</span>';
  if (s === "diag")
    return '<span class="badge" style="background:#f3e8ff;color:#7e22ce">🔬 Диагностикада</span>';
  if (s === "zapchast")
    return '<span class="badge badge-warn">⏳ Запчаст кутилмоқда</span>';
  if (s === "ehtiyot")
    return '<span class="badge" style="background:#e0f2fe;color:#0369a1">🔩 Эҳтиёт қисм кутиляпти</span>';
  if (s === "repair")
    return '<span class="badge badge-warn">🔧 Таъмирланмоқда</span>';
  if (s === "zavod")
    return '<span class="badge" style="background:#fce8d5;color:#c2410c">🏭 Заводга қайтарилади</span>';
  if (s === "hisobdan")
    return '<span class="badge" style="background:#f1f1f1;color:#555">🗑️ Ҳисобдан чиқарилади</span>';
  return '<span class="badge badge-warn">' + s + "</span>";
}

function nav(p, btn) {
  document.querySelectorAll(".page").forEach(function (x) {
    x.classList.remove("active");
  });
  document.querySelectorAll(".nav button").forEach(function (x) {
    x.classList.remove("active");
  });
  document.getElementById("page-" + p).classList.add("active");
  btn.classList.add("active");
  if (p === "royhati") loadList();
}

function genId() {
  var last =
    parseInt(localStorage.getItem("servis_counter") || "0", 10) + 1;
  localStorage.setItem("servis_counter", last);
  return String(last).padStart(10, "0");
}

async function genIdGlobal() {
  try {
    var res = await supaFetch("devices?select=id&order=id.desc&limit=1");
    var last = 0;
    if (res && res.length > 0) {
      var parsed = parseInt(res[0].id, 10);
      if (!isNaN(parsed)) last = parsed;
    }
    return String(last + 1).padStart(10, "0");
  } catch (e) {
    return genId();
  }
}

function sourceTypeLabel(t) {
  if (t === "baza") return "🏪 База магазинлардан";
  if (t === "diler") return "🏬 Дистрибьютор дўконлардан";
  if (t === "mijoz") return "👤 Ташқи мижоздан";
  return t;
}

function toggleSourceDetail() {
  var t = document.getElementById("a-source-type").value;
  var ph = document.getElementById("a-source-phone");
  ph.style.display = t === "mijoz" ? "block" : "none";
  var src = document.getElementById("a-source");
  if (t === "baza") src.placeholder = "Магазин номи";
  else if (t === "diler") src.placeholder = "Дўкон номи";
  else if (t === "mijoz") src.placeholder = "Мижоз манзили";
  else src.placeholder = "Магазин номи ёки мижоз манзили";
}

function addDevice() {
  var code = document.getElementById("a-code").value.trim();
  var brand = document.getElementById("a-brand").value.trim();
  var name = document.getElementById("a-name").value.trim();
  var model = document.getElementById("a-model").value.trim();
  var sourceType = document.getElementById("a-source-type").value;
  var source = document.getElementById("a-source").value.trim();
  var address = document.getElementById("a-address").value.trim();
  var sourcePhone = document
    .getElementById("a-source-phone")
    .value.trim();
  var fault = document.getElementById("a-fault").value.trim();
  var date = document.getElementById("a-date").value;
  var price = document.getElementById("a-price").value;
  var status = document.getElementById("a-status").value;
  var msgEl = document.getElementById("add-msg");
  msgEl.innerHTML = "";

  if (!name || !date) {
    msgEl.innerHTML =
      '<div class="msg-err">❌ Камида номи ва санани киритинг!</div>';
    return;
  }

  var btn = document.getElementById("add-btn");
  btn.disabled = true;
  btn.textContent = "⏳ Сақланмоқда...";

  genIdGlobal()
    .then(function (id) {
      var dev = {
        id: id,
        code: code,
        brand: brand,
        name: name,
        model: model,
        source_type: sourceType,
        source: source,
        address: address,
        source_phone: sourcePhone,
        fault: fault,
        date: date,
        price: price,
        status: status,
        history: [],
      };
      return supaFetch("devices", "POST", dev).then(function () {
        document.getElementById("qr-brand").textContent = brand || name;
        document.getElementById("qr-name").textContent = brand
          ? name
          : "";
        document.getElementById("qr-id").textContent =
          "ID: " + id + (code ? "  |  Код: " + code : "");
        var qrLink =
          "https://servis-com.vercel.app/texnika_servis.html?id=" + id;
        document.getElementById("qr-img").src =
          "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
          encodeURIComponent(qrLink);
        document.getElementById("qr-wrap").style.display = "block";
        [
          "a-code",
          "a-brand",
          "a-name",
          "a-model",
          "a-source",
          "a-address",
          "a-source-phone",
          "a-price",
          "a-fault",
        ].forEach(function (i) {
          document.getElementById(i).value = "";
        });
        document.getElementById("a-source-type").value = "";
        msgEl.innerHTML =
          '<div class="msg-ok">✅ Муваффақиятли қўшилди! ID: <strong>' +
          id +
          "</strong></div>";
      });
    })
    .catch(function (e) {
      msgEl.innerHTML =
        '<div class="msg-err">❌ Хатолик: ' + e.message + "</div>";
    })
    .finally(function () {
      btn.disabled = false;
      btn.textContent = "+ Қўшиш ва QR ясаш";
    });
}

function scanDev() {
  var id = document.getElementById("s-id").value.trim().toUpperCase();
  var cont = document.getElementById("scan-result");
  if (!id) {
    alert("ID киritинг");
    return;
  }
  cont.innerHTML = '<div class="spinner">⏳ Қидирилмоқда...</div>';

  supaFetch("devices?id=eq." + encodeURIComponent(id) + "&select=*")
    .then(function (data) {
      if (!data || data.length === 0) {
        cont.innerHTML =
          '<div class="card msg-err">❌ Топилмади: ' + id + "</div>";
        return;
      }
      renderDevDetail(data[0], cont);
    })
    .catch(function (e) {
      cont.innerHTML =
        '<div class="card msg-err">❌ Хатолик: ' + e.message + "</div>";
    });
}

function renderDevDetail(dev, cont) {
  var hist = dev.history || [];
  var histHTML = "";
  if (hist.length === 0) {
    histHTML =
      '<p style="font-size:13px;color:#888">Таъмир тарихи йўқ</p>';
  } else {
    var rev = hist.slice().reverse();
    for (var i = 0; i < rev.length; i++) {
      var h = rev[i];
      histHTML +=
        '<div class="history-item">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<span style="font-size:13px;color:#888">' +
        h.date +
        "</span>" +
        statusBadge(h.status) +
        "</div>" +
        '<p style="font-size:14px;margin-top:6px">' +
        h.note +
        "</p>" +
        (h.cost
          ? '<p style="font-size:12px;color:#888;margin-top:3px">Нарх: ' +
            Number(h.cost).toLocaleString() +
            " сўм</p>"
          : "") +
        "</div>";
    }
  }

  cont.innerHTML =
    '<div class="card">' +
    (dev.brand
      ? '<div class="row"><span class="lbl">Бренд</span><span class="val">' +
        dev.brand +
        "</span></div>"
      : "") +
    '<div class="row"><span class="lbl">Номи</span><span class="val">' +
    dev.name +
    "</span></div>" +
    (dev.code
      ? '<div class="row"><span class="lbl">Товар коди</span><span class="val">' +
        dev.code +
        "</span></div>"
      : "") +
    (dev.model
      ? '<div class="row"><span class="lbl">Модели</span><span class="val">' +
        dev.model +
        "</span></div>"
      : "") +
    (dev.source_type
      ? '<div class="row"><span class="lbl">Қаердан келган</span><span class="val">' +
        sourceTypeLabel(dev.source_type) +
        "</span></div>"
      : "") +
    (dev.source
      ? '<div class="row"><span class="lbl">Магазин / Мижоз номи</span><span class="val">' +
        dev.source +
        "</span></div>"
      : "") +
    (dev.address
      ? '<div class="row"><span class="lbl">Манзил</span><span class="val">' +
        dev.address +
        "</span></div>"
      : "") +
    (dev.source_phone
      ? '<div class="row"><span class="lbl">Телефон</span><span class="val"><a href="tel:' +
        dev.source_phone +
        '" style="color:#178060">' +
        dev.source_phone +
        "</a></span></div>"
      : "") +
    (dev.fault
      ? '<div class="row" style="flex-direction:column;align-items:flex-start;gap:4px"><span class="lbl">Мижоз айтган носозлик</span><span style="font-size:14px">' +
        dev.fault +
        "</span></div>"
      : "") +
    '<div class="row"><span class="lbl">Кириш санаси</span><span class="val">' +
    dev.date +
    "</span></div>" +
    (dev.price
      ? '<div class="row"><span class="lbl">Нарх</span><span class="val">' +
        Number(dev.price).toLocaleString() +
        " сўм</span></div>"
      : "") +
    '<div class="row"><span class="lbl">Ҳолат</span><span>' +
    statusBadge(dev.status) +
    "</span></div>" +
    '<div class="row"><span class="lbl">ID</span><span class="val" style="font-size:12px;color:#888">' +
    dev.id +
    "</span></div>" +
    "</div>" +
    '<p class="section-title">Таъмир тарихи (' +
    hist.length +
    " та)</p>" +
    '<div class="card">' +
    histHTML +
    "</div>" +
    '<button class="btn btn-primary" onclick="openModal(\'' +
    dev.id +
    "')\">+ Таъмир баёни қўшиш</button>" +
    '<div style="display:flex;gap:8px;margin-top:8px">' +
    '<button class="btn btn-edit" onclick="openEditModal(\'' +
    dev.id +
    "')\">✏️ Ўзгартириш</button>" +
    '<button class="btn btn-danger" onclick="deleteDev(\'' +
    dev.id +
    "')\">🗑️ Ўчириш</button>" +
    "</div>";
}

function loadList() {
  var cont = document.getElementById("list-cont");
  cont.innerHTML = '<div class="spinner">⏳ Юкланмоқда...</div>';
  supaFetch("devices?select=*&order=created_at.desc")
    .then(function (devs) {
      if (!devs || devs.length === 0) {
        cont.innerHTML =
          '<div class="card" style="color:#888;text-align:center">Ҳали техника қўшилмаган</div>';
        return;
      }
      var html = "";
      for (var i = 0; i < devs.length; i++) {
        var d = devs[i];
        var hCount = d.history ? d.history.length : 0;
        html +=
          '<div class="device-row" onclick="openFromList(\'' +
          d.id +
          "')\">" +
          '<div style="max-width:65%">' +
          '<p style="font-size:12px;color:#888">' +
          (d.brand || "") +
          "</p>" +
          '<p style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
          d.name +
          "</p>" +
          '<p style="font-size:12px;color:#888">' +
          d.id +
          (d.source ? " · " + d.source : "") +
          (hCount > 0 ? " · 🔧" + hCount : "") +
          "</p>" +
          "</div>" +
          statusBadge(d.status) +
          "</div>";
      }
      cont.innerHTML = html;
    })
    .catch(function (e) {
      cont.innerHTML =
        '<div class="msg-err">❌ Хатолик: ' + e.message + "</div>";
    });
}

function openFromList(id) {
  document.getElementById("s-id").value = id;
  document.querySelectorAll(".page").forEach(function (x) {
    x.classList.remove("active");
  });
  document.querySelectorAll(".nav button").forEach(function (x) {
    x.classList.remove("active");
  });
  document.getElementById("page-skaaner").classList.add("active");
  document.querySelectorAll(".nav button")[1].classList.add("active");
  scanDev();
}

function openModal(id) {
  currentDevId = id;
  document.getElementById("r-note").value = "";
  document.getElementById("r-cost").value = "";
  document.getElementById("r-status").value = "ok";
  document.getElementById("repair-modal").classList.add("open");
}

function closeModal() {
  document.getElementById("repair-modal").classList.remove("open");
}

function saveRepair() {
  var note = document.getElementById("r-note").value.trim();
  if (!note) {
    alert("Баён ёзинг!");
    return;
  }

  var saveBtn = document.querySelector("#repair-modal .btn-primary");
  saveBtn.disabled = true;
  saveBtn.textContent = "⏳ Сақланмоқда...";

  supaFetch(
    "devices?id=eq." + encodeURIComponent(currentDevId) + "&select=*"
  )
    .then(function (data) {
      if (!data || data.length === 0)
        throw new Error("Техника топилмади");
      var dev = data[0];
      var hist = dev.history || [];
      var today = new Date().toISOString().slice(0, 10);
      var st = document.getElementById("r-status").value;
      hist.push({
        date: today,
        note: note,
        cost: document.getElementById("r-cost").value,
        status: st,
      });

      return supaFetch(
        "devices?id=eq." + encodeURIComponent(currentDevId),
        "PATCH",
        { history: hist, status: st }
      ).then(function () {
        dev.history = hist;
        dev.status = st;
        closeModal();
        renderDevDetail(dev, document.getElementById("scan-result"));
      });
    })
    .catch(function (e) {
      alert("❌ Хатолик: " + e.message);
    })
    .finally(function () {
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 Сақлаш";
    });
}

// ===== ПАРОЛ ТИЗИМИ =====
var ADMIN_PASS = "1234";
var adminUnlocked = false;

function checkPass(callback) {
  if (adminUnlocked) {
    callback();
    return;
  }
  var p = prompt("🔐 Админ паролини киритинг:");
  if (p === ADMIN_PASS) {
    adminUnlocked = true;
    callback();
  } else if (p !== null) {
    alert("❌ Пароль нотўғри!");
  }
}

function deleteDev(id) {
  checkPass(function () {
    if (!confirm("🗑️ " + id + " ни ўчиришни тасдиқлайсизми?")) return;
    supaFetch("devices?id=eq." + encodeURIComponent(id), "DELETE")
      .then(function () {
        document.getElementById("scan-result").innerHTML =
          '<div class="msg-ok">✅ Ўчирилди!</div>';
      })
      .catch(function (e) {
        alert("Хатолик: " + e.message);
      });
  });
}

var editDevId = null;

function openEditModal(id) {
  checkPass(function () {
    supaFetch(
      "devices?id=eq." + encodeURIComponent(id) + "&select=*"
    ).then(function (data) {
      if (!data || data.length === 0) return;
      var d = data[0];
      editDevId = id;
      document.getElementById("e-code").value = d.code || "";
      document.getElementById("e-brand").value = d.brand || "";
      document.getElementById("e-name").value = d.name || "";
      document.getElementById("e-model").value = d.model || "";
      document.getElementById("e-source-type").value =
        d.source_type || "";
      document.getElementById("e-source").value = d.source || "";
      document.getElementById("e-address").value = d.address || "";
      document.getElementById("e-source-phone").value =
        d.source_phone || "";
      document.getElementById("e-fault").value = d.fault || "";
      document.getElementById("e-date").value = d.date || "";
      document.getElementById("e-price").value = d.price || "";
      document.getElementById("e-status").value = d.status || "ok";
      document.getElementById("edit-modal").classList.add("open");
    });
  });
}

function closeEditModal() {
  document.getElementById("edit-modal").classList.remove("open");
}

function saveEdit() {
  var updated = {
    code: document.getElementById("e-code").value.trim(),
    brand: document.getElementById("e-brand").value.trim(),
    name: document.getElementById("e-name").value.trim(),
    model: document.getElementById("e-model").value.trim(),
    source_type: document.getElementById("e-source-type").value,
    source: document.getElementById("e-source").value.trim(),
    address: document.getElementById("e-address").value.trim(),
    source_phone: document.getElementById("e-source-phone").value.trim(),
    fault: document.getElementById("e-fault").value.trim(),
    date: document.getElementById("e-date").value,
    price: document.getElementById("e-price").value,
    status: document.getElementById("e-status").value,
  };
  if (!updated.name || !updated.date) {
    alert("Номи ва санани киритинг!");
    return;
  }
  var btn = document.querySelector("#edit-modal .btn-primary");
  btn.disabled = true;
  btn.textContent = "⏳ Сақланмоқда...";
  supaFetch(
    "devices?id=eq." + encodeURIComponent(editDevId),
    "PATCH",
    updated
  )
    .then(function () {
      closeEditModal();
      document.getElementById("s-id").value = editDevId;
      scanDev();
    })
    .catch(function (e) {
      alert("Хатолик: " + e.message);
    })
    .finally(function () {
      btn.disabled = false;
      btn.textContent = "💾 Сақлаш";
    });
}
