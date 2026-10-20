'use strict';

// Bootstrap сам открывает окно; наш обработчик передаёт только название товара.
const orderModal = document.querySelector('#orderModal');
if (orderModal) {
  orderModal.addEventListener('show.bs.modal', event => {
    const product = event.relatedTarget?.dataset.product || 'Клавиатура Quiet';
    document.querySelector('#selected-product').textContent = product;
    document.querySelector('#order-link').href = 'order.html?product=' + encodeURIComponent(product);
  });
}

const form = document.querySelector('#order-form');
if (form) {
  const select = form.elements.product;
  const chosen = new URLSearchParams(location.search).get('product');
  // Разрешаем выбрать только существующий вариант, без вставки HTML из адреса.
  if ([...select.options].some(option => option.value === chosen)) select.value = chosen;

  form.addEventListener('submit', event => {
    event.preventDefault(); // Backend отсутствует: ни POST, ни fetch здесь нет.
    if (!form.reportValidity()) return;
    const result = document.querySelector('#form-result');
    result.hidden = false;
    result.focus();
  });
  form.addEventListener('input', () => {
    document.querySelector('#form-result').hidden = true;
  });
  // Включаем кнопку лишь после установки обработчика, запрещающего отправку.
  form.querySelector('[type="submit"]').disabled = false;
}
