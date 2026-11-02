const menuFilters = document.querySelector('.menu-filters');
const menuGrid = document.querySelector('#menu-grid');
const menuCards = [...document.querySelectorAll('.menu-card')];
const menuStatus = document.querySelector('[data-menu-status]');
const orderStatus = document.querySelector('[data-order-status]');
const orderCount = document.querySelector('[data-order-count]');
const orderSummary = document.querySelector('[data-order]');
const orderList = document.querySelector('[data-order-list]');
let orderItems = 0;
const selectedOrder = new Map();

const renderOrder = () => {
	orderItems = [...selectedOrder.values()].reduce((total, quantity) => total + quantity, 0);
	orderCount.textContent = `${orderItems} ${orderItems === 1 ? 'item' : 'itens'}`;
	orderSummary.hidden = selectedOrder.size === 0;
	orderList.replaceChildren();

	selectedOrder.forEach((quantity, name) => {
		const item = document.createElement('li');
		item.className = 'menu-order-item';

		const itemName = document.createElement('span');
		itemName.className = 'menu-order-item-name';
		itemName.textContent = name;

		if (quantity > 1) {
			const itemQuantity = document.createElement('span');
			itemQuantity.className = 'menu-order-item-quantity';
			itemQuantity.textContent = `× ${quantity}`;
			itemName.append(itemQuantity);
		}

		const removeButton = document.createElement('button');
		removeButton.className = 'menu-order-remove';
		removeButton.type = 'button';
		removeButton.dataset.removeFromOrder = name;
		removeButton.setAttribute('aria-label', `Remover ${name} do pedido`);
		removeButton.textContent = 'Remover';

		item.append(itemName, removeButton);
		orderList.append(item);
	});
};

if (menuFilters && menuGrid && menuCards.length) {
	const filters = [...menuFilters.querySelectorAll('[role="tab"]')];
	const categories = ['all', ...new Set(menuCards.map((card) => card.dataset.category))];

	categories.forEach((category) => {
		const count = category === 'all'
			? menuCards.length
			: menuCards.filter((card) => card.dataset.category === category).length;
		const countLabel = menuFilters.querySelector(`[data-count="${category}"]`);
		if (countLabel) countLabel.textContent = `(${count})`;
	});

	const activateFilter = (filter) => {
		const category = filter.dataset.filter;
		filters.forEach((item) => {
			const isSelected = item === filter;
			item.classList.toggle('is-active', isSelected);
			item.setAttribute('aria-selected', String(isSelected));
			item.tabIndex = isSelected ? 0 : -1;
		});
		menuGrid.setAttribute('aria-labelledby', filter.id);
		let visibleCount = 0;
		menuCards.forEach((card) => {
			const isVisible = category === 'all' || card.dataset.category === category;
			card.hidden = !isVisible;
			if (isVisible) visibleCount += 1;
		});
		menuStatus.textContent = `${visibleCount} ${visibleCount === 1 ? 'prato' : 'pratos'} no cardápio`;
		if (window.matchMedia('(max-width: 700px)').matches) {
			filter.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
		}
	};

	menuFilters.addEventListener('click', (event) => {
		const filter = event.target.closest('[role="tab"]');
		if (filter) activateFilter(filter);
	});

	menuFilters.addEventListener('keydown', (event) => {
		const currentIndex = filters.indexOf(document.activeElement);
		let nextIndex = currentIndex;
		if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % filters.length;
		if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + filters.length) % filters.length;
		if (event.key === 'Home') nextIndex = 0;
		if (event.key === 'End') nextIndex = filters.length - 1;
		if (nextIndex !== currentIndex) {
			event.preventDefault();
			filters[nextIndex].focus();
			activateFilter(filters[nextIndex]);
		}
	});

	menuGrid.addEventListener('click', (event) => {
		const addButton = event.target.closest('[data-add-to-order]');
		if (!addButton) return;
		const itemName = addButton.dataset.addToOrder;
		selectedOrder.set(itemName, (selectedOrder.get(itemName) || 0) + 1);
		renderOrder();
		orderStatus.textContent = `${addButton.dataset.addToOrder} adicionado ao pedido. ${orderItems} ${orderItems === 1 ? 'item' : 'itens'} no total.`;
	});

	orderList.addEventListener('click', (event) => {
		const removeButton = event.target.closest('[data-remove-from-order]');
		if (!removeButton) return;
		const itemName = removeButton.dataset.removeFromOrder;
		selectedOrder.delete(itemName);
		renderOrder();
		orderStatus.textContent = `${itemName} removido do pedido. ${orderItems} ${orderItems === 1 ? 'item' : 'itens'} no total.`;
	});
}

const locationStatuses = [...document.querySelectorAll('[data-location-status]')];
const weekdayNumbers = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const updateLocationStatuses = () => {
	locationStatuses.forEach((status) => {
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: status.dataset.timezone,
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23'
		});
		const parts = Object.fromEntries(formatter.formatToParts(new Date()).map(({ type, value }) => [type, value]));
		const currentDay = weekdayNumbers[parts.weekday];
		const currentTime = Number(parts.hour) * 60 + Number(parts.minute);
		const [opensAt, opensMinute] = status.dataset.openTime.split(':').map(Number);
		const [closesAt, closesMinute] = status.dataset.closeTime.split(':').map(Number);
		const openingTime = opensAt * 60 + opensMinute;
		const closingTime = closesAt * 60 + closesMinute;
		const isOpen = status.dataset.openDays.split(',').map(Number).includes(currentDay)
			&& currentTime >= openingTime
			&& currentTime < closingTime;
		const label = status.querySelector('[data-status-text]');

		status.classList.toggle('is-closed', !isOpen);
		label.textContent = isOpen ? 'Aberto agora' : 'Fechado agora';
	});
};

if (locationStatuses.length) {
	updateLocationStatuses();
	window.setInterval(updateLocationStatuses, 60_000);
}

const currentYear = document.querySelector('[data-current-year]');
if (currentYear) currentYear.textContent = new Date().getFullYear();
