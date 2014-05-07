Module.SelectionModule = Module.Base.extend({

	prototype: {

		elementStore: {
			elements: {
				list: { selector: "ol.selection-items" },
				removedItemList: { selector: "ol.selection-removed-items" }
			},
			collections: {
				items: { selector: "ol.selection-items>li" },
				selectedItems: { selector: "ol.selection-items>li.selected", nocache: true }
			}
		},

		options: {
			listTagName: "ol",
			selectedClass: "selected",
			hideOnRemoval: false,
			destroyHiddenFieldRegex: /_destroy\]$/,
			destroyHiddenFieldValue: 1,
			confirmOnRemove: false,
			singleRemovalConfirm: "Are you sure you want to remove this item?",
			bulkRemovalConfirm: "Are you sure you want to remove these items?"
		},

		_ready: function() {
			Module.Base.prototype._ready.call(this);

			this.elementStore.returnNative = true;

			if (this.options.hideOnRemoval && !this.removedItemList()) {
				var removedItemList = this.document.createElement("ol");
				removedItemList.className = "selection-removed-items";
				removedItemList.style.display = "none";
				this.element.appendChild(removedItemList);
			}
		},

		deselectAll: function click(event, element, params) {
			event.preventDefault();

			var items = this.items(),
			    i = 0, length = items.length;

			for (i; i < length; i++) {
				items[i].classList.remove(this.options.selectedClass);
			}

			this.notify("selectionSizeChanged");
		},

		remove: function click(event, element, params) {
			event.stop();

			var item = element.parentNode;

			if (!this.options.confirmOnRemove || this.window.confirm(params.confirm || this.options.singleRemovalConfirm)) {
				while (item && item.nodeName != "LI") {
					item = item.parentNode;
				}

				if (item) {
					this.removeItem(item);
				}
				else {
					throw new Error("Failed to find an item to remove");
				}
			}
		},

		removeAll: function click(event, element, params) {
			event.preventDefault();

			if (!this.options.confirmOnRemove || this.window.confirm(params.confirm || this.options.bulkRemovalConfirm)) {
				var list = this.list();

				while (list.childNodes.length) {
					if (list.firstChild.nodeName === "LI") {
						this.removeItem(list.firstChild);
					}
					else {
						list.removeChild(list.firstChild);
					}
				}
			}
		},

		removeSelected: function click(event, element, params) {
			event.preventDefault();

			if (!this.options.confirmOnRemove || this.window.confirm(params.confirm || this.options.bulkRemovalConfirm)) {
				var items = this.selectedItems(),
				    i = items.length;

				while (i--) {
					this.removeItem(items[i]);
				}
			}
		},

		selectAll: function click(event, element, params) {
			event.preventDefault();

			var items = this.items(),
			    i = 0, length = items.length;

			for (i; i < length; i++) {
				items[i].classList.add(this.options.selectedClass);
			}

			this.notify("selectionSizeChanged");
		},

		toggle: function click(event, element, params) {
			if (params.stop) {
				event.stop();
			}
			else {
				event.preventDefault();
			}

			element.classList.toggle(this.options.selectedClass);
			this.notify("selectionSizeChanged");
		},

		addItem: function(item) {
			this.list().appendChild(item);
			this.clearElementStoreCache();
			this.notify("itemAdded", { item: item });
		},

		createItem: function() {
			var item = this.document.createElement("li");

			item.setAttribute("data-actions", this.controllerId + ".toggle");

			return item;
		},

		getSelectedItems: function() {
			return this.selectedItems();
		},

		getSelectionSize: function() {
			return this.selectedItems().length;
		},

		removeItem: function(item, keepCache, doNotNotify) {
			this.list().removeChild(item);

			if (this.options.hideOnRemoval) {
				var inputs = item.querySelectorAll("input[type=hidden]"),
				    i = 0, length = inputs.length;

				for (i; i < length; i++) {
					if (this.options.destroyHiddenFieldRegex.test(inputs[i].name)) {
						inputs[i].value = this.options.destroyHiddenFieldValue;
						break;
					}
				}

				this.removedItemList().appendChild(item);
			}

			if (!keepCache) {
				this.clearElementStoreCache();
			}

			if (!doNotNotify) {
				this.notify("itemRemoved", { item: item });
			}
		}

	}

});
