document.addEventListener("scroll", function () {
  const arrow = document.querySelector(".arrow-down");
  if (window.scrollY > 100) {
    arrow.classList.add("hidden");
  } else {
    arrow.classList.remove("hidden");
  }
});

document
  .querySelector(".arrow-down")
  .addEventListener("click", function (event) {
    event.preventDefault();
    document.querySelector("#comments-section").scrollIntoView({
      behavior: "smooth",
    });
  });
