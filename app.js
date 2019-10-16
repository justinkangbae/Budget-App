//BUDGET CONTROLLER
var budgetController = (function () {

    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    //adding method to expenses
    Expense.prototype.calcPercentage = function(totalIncome) {

        //only update percentage when there is an income, dividing by 0 is no good
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }    
    };

    //gets percentage
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }


    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },

        totals: {
            exp: 0,
            inc: 0,
        },

        budget: 0,
        percentage: -1
    };

    calculateTotal = function(type) {
        var sum = 0;

        data.allItems[type].forEach(function(cur) {
            sum += cur.value; 
        });

        data.totals[type] = sum;
    }


    return {
        addItem: function (type, des, val) {
            var newItem, ID;

            //ID = last ID + 1

            //create new ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }


            //create new ID based on inc or exp type
            if (type === "exp") {
                newItem = new Expense(ID, des, val);
            } else if (type === "inc") {
                newItem = new Income(ID, des, val);
            }

            //push it into our data structure
            data.allItems[type].push(newItem);

            //return the new element
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;

            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if(index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function() {

            //Calculate total income and expenses
            calculateTotal("exp");
            calculateTotal("inc");

            //Calculate budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            //Calculate percentage of income that we spent
            if(data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {

            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            })
        },

        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(cur) {
                return cur.getPercentage();
            });

            return allPerc;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },

        testing: function () {
            return data;
        }
    }

})();



//UI CONTROLLER
var UIController = (function () {
    var DOMstrings = {
        inputType: ".add__type",
        inputDescription: ".add__description",
        inputValue: ".add__value",
        inputBtn: ".add__btn",
        incomeContainer: ".income__list",
        expensesContainer: ".expenses__list",
        budgetLabel: ".budget__value",
        incomeLabel: ".budget__income--value",
        expensesLabel: ".budget__expenses--value",
        percentageLabel: ".budget__expenses--percentage",
        container: ".container",
        expensesPercLabel: ".item__percentage"
    };

    var formatNumber = function(num, type) {
        //+ or - before number, two decimal points, comma separating thousands
        var numSplit, int, dec, sign;

        num = Math.abs(num);
        num = num.toFixed(2);

        numSplit = num.split(".");

        int = numSplit[0];
        

        if(int.length > 3) {
            int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3);
        }
        
        dec = numSplit[1];

        return (type === "exp" ? sign = "-" : sign = "+") + " " + int + "." + dec;
    };

    return {
        getInput: function () {
            return {
                type: document.querySelector(DOMstrings.inputType).value, //will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },

        getDOMstrings: function () {
            return DOMstrings;
        },

        addListItem: function (obj, type) {
            var html, element;

            //1. Create HTML string with template string text
            if (type === "inc") {
                element = DOMstrings.incomeContainer;
                html = `<div class="item clearfix" id="inc-${obj.id}"><div class="item__description">${obj.description}</div><div class="right clearfix"><div class="item__value">${formatNumber(obj.value, type)}</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>`;
            } else if (type === "exp") {
                element = DOMstrings.expensesContainer;
                html = `<div class="item clearfix" id="exp-${obj.id}"><div class="item__description">${obj.description}</div><div class="right clearfix"><div class="item__value">${formatNumber(obj.value, type)}</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>`;
            }

            //2. Insert HTML into DOM
            document.querySelector(element).insertAdjacentHTML("beforeend", html);
        },

        deleteListItem: function(selectorID) {
            //selectorID is the retrieved inc-0 exp-0 element
            var el = document.getElementById(selectorID);

            //to remove an element we have to go up to parent and then remove its child, can't delete directly
            el.parentNode.removeChild(el);
        },

        clearFields: function () {
            var fields, fieldsArr;

            //returns list, not array, we want to be able to use slice method on list 
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            //must convert list to array using slice method in array prototype and passing in list
            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
                current.description = "";
            });

            fieldsArr[0].focus();
        },

        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = "inc" : type = "exp";

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, "inc");
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, "exp");

            if(obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + "%";
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = "---";
            }
        },

        displayPercentages: function(percentages) {
            
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

            var nodeListForEach = function(list, callback) {

                for(var i = 0; i < list.length; i++) {
                    callback(list[i], i);
                }

            };

            nodeListForEach(fields, function(current, index) {

                if(percentages[index] > 0) {
                    current.textContent = percentages[index] + "%";
                } else {
                    current.textContent = "---";
                }
            });

        }
    };

})();



//GLOBAL APP CONTROLLER
var controller = (function (budgetCtrl, UICtrl) {

    var setupEventListeners = function () {
        var DOM = UICtrl.getDOMstrings();

        //add event listener to input button
        document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

        document.addEventListener("keypress", function (event) {
            //keycode 13 is enter key, which is for older browsers
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);
    };

    var updateBudget = function () {
        //1. Calculate budget
        budgetCtrl.calculateBudget();

        //2. Return the budget
        var budget = budgetCtrl.getBudget();

        //3. Display budget in UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {
        //1. Calculate percentages
        budgetCtrl.calculatePercentages();

        //2. Read them from budget controller
        var percentages = budgetCtrl.getPercentages();

        //3. Update UI with new percentages
        UICtrl.displayPercentages(percentages);
    }

    var ctrlAddItem = function () {
        var input, newItem;

        //1. Get field input data
        input = UICtrl.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            //2. Add item to budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            //3. Add item to UI
            UICtrl.addListItem(newItem, input.type);

            //4. Clear the field
            UICtrl.clearFields();

            //5. Calculate and update budget 
            updateBudget();

            //6. Calculate and update percentages
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;

        //this is the only element with an id
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        //if element has an id
        if(itemID) {
            //inc-1 exp-0
            splitID = itemID.split("-");
            type = splitID[0];
            ID = parseInt(splitID[1]);

            //1. delete item from data structure
            budgetCtrl.deleteItem(type, ID);

            //2. delete item from ui
            UICtrl.deleteListItem(itemID);

            //3. update and show new budget
            updateBudget();

            //4. Calculate and update percentages
            updatePercentages();
        }
    };

    return {
        init: function () {
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: 0
            });
            setupEventListeners();
        }
    }

})(budgetController, UIController);

controller.init();