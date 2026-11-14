const formatItemCount = (count) => `${count} ${count === 1 ? 'item' : 'itens'}`;

const initMenu = () => {
	const menuFilters = document.querySelector('.menu-filters');
	const menuGrid = document.querySelector('#menu-grid');
	const menuCards = [...document.querySelectorAll('.menu-card')];

	if (!menuFilters || !menuGrid || menuCards.length === 0) return;

	const filters = [...menuFilters.querySelectorAll('[role="tab"]')];
	const menuStatus = document.querySelector('[data-menu-status]');
	const orderStatus = document.querySelector('[data-order-status]');
	const orderCount = document.querySelector('[data-order-count]');
	const orderSummary = document.querySelector('[data-order]');
	const orderList = document.querySelector('[data-order-list]');
	const selectedOrder = new Map();

	const categoryCounts = new Map([['all', menuCards.length]]);
	menuCards.forEach((card) => {
		const category = card.dataset.category;
		categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
	});

	filters.forEach((filter) => {
		const countLabel = menuFilters.querySelector(`[data-count="${filter.dataset.filter}"]`);
		const count = categoryCounts.get(filter.dataset.filter);
		if (countLabel && count !== undefined) countLabel.textContent = `(${count})`;
	});

	const updateMenu = (selectedFilter) => {
		const category = selectedFilter.dataset.filter;
		let visibleCount = 0;

		filters.forEach((filter) => {
			const isSelected = filter === selectedFilter;
			filter.classList.toggle('is-active', isSelected);
			filter.setAttribute('aria-selected', String(isSelected));
			filter.tabIndex = isSelected ? 0 : -1;
		});

		menuCards.forEach((card) => {
			const isVisible = category === 'all' || card.dataset.category === category;
			card.hidden = !isVisible;
			if (isVisible) visibleCount += 1;
		});

		menuGrid.setAttribute('aria-labelledby', selectedFilter.id);
		menuStatus.textContent = `${visibleCount} ${visibleCount === 1 ? 'prato' : 'pratos'} no cardápio`;

		if (window.matchMedia('(max-width: 700px)').matches) {
			selectedFilter.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
		}
	};

	const renderOrder = () => {
		let itemCount = 0;
		selectedOrder.forEach((quantity) => {
			itemCount += quantity;
		});

		orderCount.textContent = formatItemCount(itemCount);
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

		return itemCount;
	};

	menuFilters.addEventListener('click', (event) => {
		const filter = event.target.closest('[role="tab"]');
		if (filter) updateMenu(filter);
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
			updateMenu(filters[nextIndex]);
		}
	});

	menuGrid.addEventListener('click', (event) => {
		const addButton = event.target.closest('[data-add-to-order]');
		if (!addButton) return;

		const itemName = addButton.dataset.addToOrder;
		selectedOrder.set(itemName, (selectedOrder.get(itemName) || 0) + 1);
		const itemCount = renderOrder();
		orderStatus.textContent = `${itemName} adicionado ao pedido. ${formatItemCount(itemCount)} no total.`;
	});

	orderList.addEventListener('click', (event) => {
		const removeButton = event.target.closest('[data-remove-from-order]');
		if (!removeButton) return;

		const itemName = removeButton.dataset.removeFromOrder;
		selectedOrder.delete(itemName);
		const itemCount = renderOrder();
		orderStatus.textContent = `${itemName} removido do pedido. ${formatItemCount(itemCount)} no total.`;
	});
};

const initLocationStatuses = () => {
	const locations = [...document.querySelectorAll('[data-location-status]')];
	if (locations.length === 0) return;

	const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

	const updateStatuses = () => {
		locations.forEach((location) => {
			const formatter = new Intl.DateTimeFormat('en-US', {
				timeZone: location.dataset.timezone,
				weekday: 'short',
				hour: '2-digit',
				minute: '2-digit',
				hourCycle: 'h23'
			});
			const parts = Object.fromEntries(
				formatter.formatToParts(new Date()).map(({ type, value }) => [type, value])
			);
			const currentDay = weekdayIndex[parts.weekday];
			const currentTime = Number(parts.hour) * 60 + Number(parts.minute);
			const [opensAt, opensMinute] = location.dataset.openTime.split(':').map(Number);
			const [closesAt, closesMinute] = location.dataset.closeTime.split(':').map(Number);
			const openingTime = opensAt * 60 + opensMinute;
			const closingTime = closesAt * 60 + closesMinute;
			const openDays = location.dataset.openDays.split(',').map(Number);
			const isOpen = openDays.includes(currentDay)
				&& currentTime >= openingTime
				&& currentTime < closingTime;

			location.classList.toggle('is-closed', !isOpen);
			location.querySelector('[data-status-text]').textContent = isOpen ? 'Aberto agora' : 'Fechado agora';
		});
	};

	updateStatuses();
	window.setInterval(updateStatuses, 60_000);
};

const updateFooterYear = () => {
	const year = document.querySelector('[data-current-year]');
	if (year) year.textContent = new Date().getFullYear();
};

initMenu();
initLocationStatuses();
updateFooterYear();
