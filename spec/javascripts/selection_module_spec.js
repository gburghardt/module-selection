describe("Module.SelectionModule", function() {

	function FauxDocument() {}
	FauxDocument.prototype = {
		constructor: FauxDocument,
		createElement: function() {},
		querySelector: function() {},
		querySelectorAll: function() {},
	};

	function FauxWindow() {}
	FauxWindow.prototype = {
		constructor: FauxWindow,
		alert: function() {},
		confirm: function() {}
	};

	var module, element;

	beforeEach(function() {
		element = document.createElement("div");
		module = new Module.SelectionModule();
		module.setElement(element);
	});

	it("creates a list for removed items", function() {
		module.setOptions({ hideOnRemoval: true });
		module.init();

		var list = element.querySelector(".selection-removed-items");

		expect(list.nodeName).toBe("OL");
		expect(list.className).toBe("selection-removed-items");
	});

	it("adds an item", function() {
		spyOn(module, "clearElementStoreCache");
		spyOn(module, "notify");

		var list = document.createElement("ol"),
		    item = document.createElement("li");

		list.className = "selection-items";
		element.appendChild(list);

		module.init();

		module.addItem(item);

		expect(module.clearElementStoreCache).toHaveBeenCalled();
		expect(module.notify).toHaveBeenCalledWith("itemAdded", { item: item });
	});

	it("creates a new item", function() {
		var list = document.createElement("ol"),
		    item = null;

		list.className = "selection-items";
		element.appendChild(list);

		module.controllerId = "testing";

		module.init();

		item = module.createItem();

		expect(item.getAttribute("data-actions")).toBe("testing.toggle");
	});

	describe("removeItem", function() {
		var list, item;

		beforeEach(function() {
			item = document.createElement("li");
			list = document.createElement("ol");
			list.className = "selection-items";
			list.appendChild(item);
			element.appendChild(list);
			spyOn(module, "clearElementStoreCache");
			spyOn(module, "notify");
		});

		it("removes an item from the list", function() {
			module.init();
			module.removeItem(item);

			expect(list.childNodes.length).toBe(0);
		});

		it("clears the ElementStore cache", function() {
			module.init();
			module.removeItem(item);

			expect(module.clearElementStoreCache).toHaveBeenCalled();
		});

		it("does not clear the ElementStore cache", function() {
			module.init();
			module.removeItem(item, true);

			expect(module.clearElementStoreCache).not.toHaveBeenCalled();
		});

		it("sends a notification that an item was removed", function() {
			module.init();
			module.removeItem(item);

			expect(module.notify).toHaveBeenCalledWith("itemRemoved", { item: item });
		});

		it("does not send a notification that an item was removed", function() {
			module.init();
			module.removeItem(item, false, true);

			expect(module.notify).not.toHaveBeenCalled();
		});

		it("hides an item and sets a hidden field value", function() {
			item.innerHTML = '<input type="hidden" name="foo[bar][id]" value="83"><input type="hidden" name="foo[bar][_destroy]">';
			module.options.hideOnRemoval = true;
			module.init();
			module.removeItem(item);

			expect(list.childNodes.length).toBe(0);
			expect(module.removedItemList().firstChild).toBe(item);
			expect(item.firstChild.value).toBe("83");
			expect(item.childNodes[1].value).toBe("1");
		});

	});

	describe("module actions", function() {

		var event, params, actionElement, list;

		beforeEach(function() {
			actionElement = document.createElement("li");
			event = new Oxydizr.MockEvent("click");
			event.stop = function() {};
			list = document.createElement("ol");
			list.className = "selection-items";
			element.appendChild(list);
			params = {};
			spyOn(module, "notify");
		});

		it("deselects all selected items", function() {
			module.init();
			list.innerHTML = '<li class="selected">1</li>'
			               + '<li class="selected">2</li>';

			expect(module.getSelectionSize()).toBe(2);

			module.deselectAll(event, actionElement, params);

			expect(module.getSelectionSize()).toBe(0);
			expect(module.notify).toHaveBeenCalledWith("selectionSizeChanged");
		});

		describe("remove", function() {

			var item;

			beforeEach(function() {
				actionElement = document.createElement("button");
				item = document.createElement("li");
				item.appendChild(actionElement);
				list.appendChild(item);
				spyOn(module, "removeItem");
				module.init();
				module.window = new FauxWindow();
			});

			it("removes an item from the list", function() {
				spyOn(module.window, "confirm");
				module.remove(event, actionElement, params);

				expect(module.removeItem).toHaveBeenCalledWith(item);
				expect(module.window.confirm).not.toHaveBeenCalled();
			});

			it("confirms the removal using a message from the options", function() {
				module.options.confirmOnRemove = true;
				module.options.singleRemovalConfirm = "testing";
				spyOn(module.window, "confirm").and.returnValue(true);

				module.remove(event, actionElement, params);

				expect(module.window.confirm).toHaveBeenCalledWith("testing");
				expect(module.removeItem).toHaveBeenCalledWith(item);
			});

			it("confirms the removal using a message from the action params", function() {
				params.confirm = "testing";
				module.options.confirmOnRemove = true;
				spyOn(module.window, "confirm").and.returnValue(true);

				module.remove(event, actionElement, params);

				expect(module.window.confirm).toHaveBeenCalledWith("testing");
				expect(module.removeItem).toHaveBeenCalledWith(item);
			});

			it("throws an error if the element is not a list item", function() {
				actionElement = document.createElement("div");

				expect(function() {
					module.remove(event, actionElement, params);
				}).toThrowError("Failed to find an item to remove");
			});

		});

		describe("removeAll", function() {

			beforeEach(function() {
				spyOn(module, "removeItem").and.callThrough();
				actionElement = document.createElement("button");
				module.init();
				module.window = new FauxWindow();
				list.innerHTML = '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>';
			});

			it("removes all items from the list", function() {
				module.removeAll(event, actionElement, params);

				expect(list.childNodes.length).toBe(0);
			});

			it("confirms the removal using a message from the options", function() {
				spyOn(module.window, "confirm").and.callThrough();
				module.options.confirmOnRemove = true;
				module.options.bulkRemovalConfirm = "testing";

				module.removeAll(event, actionElement, params);

				expect(module.window.confirm).toHaveBeenCalledWith("testing");
			});

			it("confirms the removal using a message from the action params", function() {
				spyOn(module.window, "confirm").and.callThrough();
				module.options.confirmOnRemove = true;
				params.confirm = "testing";

				module.removeAll(event, actionElement, params);

				expect(module.window.confirm).toHaveBeenCalledWith("testing");
			});

		});

		describe("selectAll", function() {

			beforeEach(function() {
				module.init();
				actionElement = document.createElement("button");
				list.innerHTML = '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>'
				               + '\n    <li></li>';
			});

			it("selects all items in the list", function() {
				module.selectAll(event, actionElement, params);

				expect(module.getSelectionSize()).toBe(7);
			});

			it("sends a notification that the selection size has changed", function() {
				module.selectAll(event, actionElement, params);

				expect(module.notify).toHaveBeenCalledWith("selectionSizeChanged");
			});

		});

		describe("toggle", function() {

			var item;

			beforeEach(function() {
				list.appendChild(actionElement);
				spyOn(event, "stop");
				spyOn(event, "preventDefault");
				spyOn(event, "stopPropagation");
				module.init();
			});

			it("stops the event", function() {
				params.stop = true;

				module.toggle(event, actionElement, params);

				expect(event.stop).toHaveBeenCalled();
			});

			it("prevents the event's default action", function() {
				module.toggle(event, actionElement, params);

				expect(event.preventDefault).toHaveBeenCalled();
				expect(event.stop).not.toHaveBeenCalled();
			});

			it("selects an item", function() {
				module.toggle(event, actionElement, params);

				expect(actionElement.className).toBe(module.options.selectedClass);
			});

			it("deselects an item", function() {
				actionElement.className = module.options.selectedClass;

				module.toggle(event, actionElement, params);

				expect(actionElement.className).toBe("");
			});

			it("sends a notification that the selection size has changed", function() {
				module.toggle(event, actionElement, params);

				expect(module.notify).toHaveBeenCalledWith("selectionSizeChanged");
			});

		});

	});

});
