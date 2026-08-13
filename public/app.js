function showMessage(el, text, isError) {
  el.textContent = text;
  el.classList.remove("error", "success");
  el.classList.add("show", isError ? "error" : "success");
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
