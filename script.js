document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'kanban-treker-v2';
    const defaultTasks = {
        todo: [
            createTask('Определить приоритеты спринта'),
            createTask('Подготовить презентацию статуса')
        ],
        'in-progress': [createTask('Обновить дизайн карточек')],
        done: [createTask('Собрать фидбек команды')]
    };

    const board = document.getElementById('board');
    const form = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    const template = document.getElementById('task-template');

    let state = loadState() || defaultTasks;

    render();

    form.addEventListener('submit', event => {
        event.preventDefault();
        const text = input.value.trim();

        if (!text) {
            return;
        }

        state.todo.unshift(createTask(text));
        input.value = '';
        persistAndRender();
    });

    board.addEventListener('click', event => {
        const deleteButton = event.target.closest('.task__delete');

        if (!deleteButton) {
            return;
        }

        const taskNode = deleteButton.closest('.task');
        const columnNode = deleteButton.closest('.column');
        const columnId = columnNode?.dataset.column;

        if (!taskNode || !columnId) {
            return;
        }

        state[columnId] = state[columnId].filter(task => task.id !== taskNode.dataset.id);
        persistAndRender();
    });

    board.addEventListener('dragstart', event => {
        const task = event.target.closest('.task');

        if (!task) {
            return;
        }

        event.dataTransfer.setData('text/plain', task.dataset.id);
        event.dataTransfer.effectAllowed = 'move';
        task.classList.add('dragging');
    });

    board.addEventListener('dragend', event => {
        event.target.closest('.task')?.classList.remove('dragging');
        board.querySelectorAll('.column').forEach(column => column.classList.remove('dropzone'));
    });

    board.addEventListener('dragover', event => {
        const column = event.target.closest('.column');

        if (!column) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        board.querySelectorAll('.column').forEach(item => {
            item.classList.toggle('dropzone', item === column);
        });
    });

    board.addEventListener('drop', event => {
        const column = event.target.closest('.column');

        if (!column) {
            return;
        }

        event.preventDefault();
        const taskId = event.dataTransfer.getData('text/plain');
        const targetColumnId = column.dataset.column;

        moveTask(taskId, targetColumnId);
    });

    function moveTask(taskId, targetColumnId) {
        if (!taskId || !targetColumnId) {
            return;
        }

        let movedTask = null;

        Object.keys(state).forEach(columnId => {
            const taskIndex = state[columnId].findIndex(task => task.id === taskId);

            if (taskIndex !== -1) {
                [movedTask] = state[columnId].splice(taskIndex, 1);
            }
        });

        if (!movedTask) {
            return;
        }

        state[targetColumnId].unshift(movedTask);
        persistAndRender();
    }

    function render() {
        Object.entries(state).forEach(([columnId, tasks]) => {
            const column = board.querySelector(`[data-column="${columnId}"]`);
            const list = column.querySelector('.task-list');
            const badge = board.querySelector(`[data-count="${columnId}"]`);

            list.innerHTML = '';

            tasks.forEach(task => {
                const taskElement = template.content.firstElementChild.cloneNode(true);
                taskElement.dataset.id = task.id;
                taskElement.querySelector('.task__text').textContent = task.text;
                list.appendChild(taskElement);
            });

            badge.textContent = String(tasks.length);
        });
    }

    function persistAndRender() {
        saveState(state);
        render();
    }

    function loadState() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                return null;
            }

            const parsed = JSON.parse(data);
            if (!parsed.todo || !parsed['in-progress'] || !parsed.done) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    function saveState(nextState) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }

    function createTask(text) {
        return {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            text
        };
    }
});
