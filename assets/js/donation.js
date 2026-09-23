/* IBAN copying: retain a selectable field when clipboard access is unavailable. */
(function () {
  var button = document.getElementById('copy-iban');
  var field = document.getElementById('donation-iban');
  var status = document.getElementById('donation-status');
  if (!button || !field || !status) return;
  button.hidden = false;
  button.addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(field.value.replace(/\s/g, ''));
      status.textContent = 'IBAN kopyalandı. Banka uygulamanıza yapıştırabilirsiniz.';
    } catch (error) {
      field.focus();
      field.select();
      field.setSelectionRange(0, field.value.length);
      status.textContent = 'IBAN seçildi. Basılı tutarak veya kopyalama menüsünden kopyalayabilirsiniz.';
    }
  });
})();
