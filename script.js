document.addEventListener('DOMContentLoaded', function () {
    const todoInput = document.getElementById('todo-input');
    const tagInput = document.getElementById('tag-input');
    const addTodoButton = document.getElementById('add-todo');
    const todoList = document.getElementById('todo-list');
    const deleteAllButton = document.getElementById('delete-all');
    const tagFilters = document.getElementById('tag-filters');

    // Load existing todos from storage
    chrome.storage.local.get(['todos'], function (result) {
        const todos = result.todos || [];
        todos.forEach(todo => addTodoToList(todo));
        updateTagFilters(todos);
    });

    addTodoButton.addEventListener('click', function () {
        const task = todoInput.value.trim();
        const tag = tagInput.value.trim();

        if (task) {
            const todo = { task, tag, completed: false };
            addTodoToList(todo);

            // Save to storage
            chrome.storage.local.get(['todos'], function (result) {
                const todos = result.todos || [];
                todos.push(todo);
                chrome.storage.local.set({ todos }, function () {
                    updateTagFilters(todos);
                });
            });

            // Clear input fields
            todoInput.value = '';
            tagInput.value = '';
        } else {
            console.log("Task input is empty. Please enter a task.");
        }
    });

    deleteAllButton.addEventListener('click', function () {
        todoList.innerHTML = '';
        chrome.storage.local.set({ todos: [] }, function () {
            updateTagFilters([]);
        });
    });

    function addTodoToList(todo) {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', function () {
            todo.completed = checkbox.checked;
            li.classList.toggle('completed', todo.completed);

            // Update storage
            chrome.storage.local.get(['todos'], function (result) {
                const todos = result.todos || [];
                const index = todos.findIndex(t => t.task === todo.task && t.tag === todo.tag);
                if (index > -1) {
                    todos[index].completed = todo.completed;
                    chrome.storage.local.set({ todos });
                }
            });
        });

        const span = document.createElement('span');
        span.textContent = `${todo.task} ${todo.tag ? '[' + todo.tag + ']' : ''}`;

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'material-symbols-outlined item_icon';
        deleteIcon.textContent = 'delete_sweep';
        deleteIcon.addEventListener('click', function () {
            li.remove();

            // Remove from storage
            chrome.storage.local.get(['todos'], function (result) {
                const todos = result.todos || [];
                const index = todos.findIndex(t => t.task === todo.task && t.tag === todo.tag);
                if (index > -1) {
                    todos.splice(index, 1);
                    chrome.storage.local.set({ todos }, function () {
                        updateTagFilters(todos);
                    });
                }
            });
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteIcon);
        todoList.appendChild(li);

        if (todo.completed) {
            li.classList.add('completed');
        }
    }

    function updateTagFilters(todos) {
        const tags = [...new Set(todos.map(todo => todo.tag).filter(tag => tag))];
        tagFilters.innerHTML = '';

        // Create the "All Tags" button
        const allTagsButton = document.createElement('span');
        allTagsButton.textContent = 'All Tags';
        allTagsButton.className = 'all-tags';
        allTagsButton.addEventListener('click', function () {
            showAllTodos();
        });
        tagFilters.appendChild(allTagsButton);

        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.textContent = tag;
            tagElement.className = 'tag';
            tagElement.style.backgroundColor = generateLightColor(tag);
            tagElement.addEventListener('click', function () {
                filterTodosByTag(tag);
            });
            tagFilters.appendChild(tagElement);
        });
    }

    function filterTodosByTag(tag) {
        chrome.storage.local.get(['todos'], function (result) {
            const todos = result.todos || [];
            todoList.innerHTML = '';
            todos.filter(todo => todo.tag === tag).forEach(todo => addTodoToList(todo));
        });
    }

    function showAllTodos() {
        chrome.storage.local.get(['todos'], function (result) {
            const todos = result.todos || [];
            todoList.innerHTML = '';
            todos.forEach(todo => addTodoToList(todo));
        });
    }

    function generateLightColor(tag) {
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = `hsl(${hash % 360}, 100%, 85%)`;
        return color;
    }
});