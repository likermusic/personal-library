const STORAGE_KEY = "personal-library-books";

const statusNames = {
  planned: "Хочу прочитать",
  reading: "Читаю",
  finished: "Прочитано",
};

const bookForm = document.querySelector("#book-form");
const titleInput = document.querySelector("#title");
const authorInput = document.querySelector("#author");
const statusInput = document.querySelector("#status");
const statusFilter = document.querySelector("#filter");
const bookList = document.querySelector("#book-list");
const bookTemplate = document.querySelector("#book-template");
const emptyState = document.querySelector("#empty-state");
const readCount = document.querySelector("#read-count");
const totalCount = document.querySelector("#total-count");
const filterResult = document.querySelector("#filter-result");

let books = getBooksFromStorage();

function getBooksFromStorage() {
  const savedBooks = localStorage.getItem(STORAGE_KEY);

  if (!savedBooks) {
    return [];
  }

  try {
    const parsedBooks = JSON.parse(savedBooks);
    return Array.isArray(parsedBooks) ? parsedBooks : [];
  } catch (error) {
    console.error("Не удалось прочитать список книг:", error);
    return [];
  }
}

function saveBooksToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function createBookId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function createBookCard(book) {
  const card = bookTemplate.content.firstElementChild.cloneNode(true);

  card.dataset.id = book.id;
  card.dataset.status = book.status;
  card.querySelector(".book-card__status").textContent = statusNames[book.status];
  card.querySelector(".book-card__title").textContent = book.title;
  card.querySelector(".book-card__author").textContent = book.author;
  card.querySelector(".book-card__select").value = book.status;
  card.querySelector(".delete-button").ariaLabel = `Удалить книгу «${book.title}»`;

  return card;
}

function renderBooks() {
  const selectedStatus = statusFilter.value;
  const visibleBooks =
    selectedStatus === "all"
      ? books
      : books.filter((book) => book.status === selectedStatus);

  bookList.innerHTML = "";

  visibleBooks.forEach((book) => {
    bookList.append(createBookCard(book));
  });

  updateStatistics();
  updateEmptyState(visibleBooks.length, selectedStatus);
}

function updateStatistics() {
  const finishedBooks = books.filter((book) => book.status === "finished");

  readCount.textContent = finishedBooks.length;
  totalCount.textContent = books.length;
}

function updateEmptyState(visibleBooksCount, selectedStatus) {
  const isEmpty = visibleBooksCount === 0;
  const emptyTitle = emptyState.querySelector("h3");
  const emptyText = emptyState.querySelector("p");

  emptyState.hidden = !isEmpty;
  bookList.hidden = isEmpty;

  if (books.length === 0) {
    emptyTitle.textContent = "Полка пока пустует";
    emptyText.textContent = "Добавьте первую книгу — она появится здесь.";
  } else if (isEmpty) {
    emptyTitle.textContent = "В этом разделе пусто";
    emptyText.textContent = "Попробуйте выбрать другой статус.";
  }

  if (selectedStatus === "all") {
    filterResult.textContent = `Все книги · ${books.length}`;
  } else {
    filterResult.textContent = `${statusNames[selectedStatus]} · ${visibleBooksCount}`;
  }
}

function showFieldError(input, message) {
  const field = input.closest(".field");
  field.classList.toggle("field--invalid", Boolean(message));
  field.querySelector(".field__error").textContent = message;
}

function validateForm() {
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();

  showFieldError(titleInput, title ? "" : "Введите название книги");
  showFieldError(authorInput, author ? "" : "Введите имя автора");

  return Boolean(title && author);
}

bookForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!validateForm()) {
    const firstInvalidInput = bookForm.querySelector(".field--invalid input");
    firstInvalidInput?.focus();
    return;
  }

  const newBook = {
    id: createBookId(),
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    status: statusInput.value,
  };

  books.push(newBook);
  saveBooksToStorage();
  renderBooks();

  bookForm.reset();
  titleInput.focus();
});

bookForm.addEventListener("input", function (event) {
  if (event.target.matches("input")) {
    showFieldError(event.target, "");
  }
});

statusFilter.addEventListener("change", renderBooks);

// Делегирование событий: карточки создаются динамически,
// поэтому обработчики назначены их общему родителю.
bookList.addEventListener("click", function (event) {
  const deleteButton = event.target.closest(".delete-button");

  if (!deleteButton) {
    return;
  }

  const card = deleteButton.closest(".book-card");
  const bookId = Number(card.dataset.id);

  books = books.filter((book) => book.id !== bookId);
  saveBooksToStorage();
  renderBooks();
});

bookList.addEventListener("change", function (event) {
  if (!event.target.matches(".book-card__select")) {
    return;
  }

  const card = event.target.closest(".book-card");
  const bookId = Number(card.dataset.id);
  const book = books.find((item) => item.id === bookId);

  if (!book) {
    return;
  }

  book.status = event.target.value;
  saveBooksToStorage();
  renderBooks();
});

renderBooks();
