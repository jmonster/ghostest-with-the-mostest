const API = "http://localhost:3000";
const relativeTime = new RelativeTime();
// i.e. $(document).ready(() => {})
// compliments of https://stackoverflow.com/a/9899701
function docReady(fn) {
  // see if DOM is already available
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

// compliments of https://stackoverflow.com/a/35385518
function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

async function submitUpvote(id) {
  const response = await fetch(`${API}/comments/upvote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (response.status > 299) {
    throw new Error(
      `Failed to upvote due to network error: ${response.status} ${response.statusText}`
    );
  }

  // update local UI to reflect change
  const el = document.getElementById(`upvote_count(${id})`);
  const prevValue = el.innerHTML.match(/\((\d+)\)/);
  el.innerHTML = prevValue ? `(${parseInt(prevValue[1], 10) + 1})` : "(1)";
}

function htmlFromData({
  id,
  users_name,
  avatar_url,
  created_at,
  body,
  upvote_count,
}) {
  return `
    <div class="flex flex-row my-4">
      <img src="${avatar_url}" class="rounded-full w-12 h-12 mr-4" />
      <div class="flex flex-col">
        <div class="flex items-center">
          <span class="darker-blue font-bold">${users_name}</span>
          <span class="dark-blue font-light text-sm">・${relativeTime.from(
            new Date(created_at)
          )}</span>
        </div>
        <p class="darker-blue my-1">${body}</p>
        <div class="font-bold dark-blue text-xs my-4">
          <span class="mr-2" role="button" ${
            id ? `onclick="submitUpvote('${id}')"` : ""
          }>
            <span class="mr-1"">▲</span>
            <span>Upvote <span id="upvote_count(${id})">${
    upvote_count > 0 ? `(${upvote_count})` : ""
  }</span></span>
          </span>
          <span>Reply</span>
        </div>
      </div>
    </div>`;
}

docReady(async function () {
  // choose a random users_name on each page load
  const anonymousUsers = [
    { name: "Lisa Simpson", avatar: "/images/lisa.jpg" },
    { name: "Bart Simpson", avatar: "/images/bart.jpg" },
    { name: "Marge Simpson", avatar: "/images/marge.jpg" },
    { name: "Homer Simpson", avatar: "/images/homer.jpg" },
  ];
  const randomIdx = Math.floor(Math.random() * anonymousUsers.length);
  const users_name = anonymousUsers[randomIdx].name;
  const avatar_url = anonymousUsers[randomIdx].avatar;

  const comments = await (await fetch(`${API}/comments`)).json();
  // TODO scope comments under different discussions instead of one global

  // render html blobs for each comment
  const commentElements = comments.map(htmlFromData);

  // add them to the DOM
  const commentsParent = window.document.getElementById("comments");
  commentElements.forEach((el) =>
    commentsParent.appendChild(htmlToElement(el))
  );

  // wire-up comment submit button
  const submitBtn = document.getElementById("submitCommentBtn");
  submitBtn.onclick = async () => {
    const comment = document.getElementById("new-comment-input").value;
    if (comment.length === 0) return;

    const html = htmlFromData({
      users_name,
      avatar_url,
      created_at: Date.now(),
      body: comment,
    });
    commentsParent.appendChild(htmlToElement(html));
    document.getElementById("new-comment-input").value = "";

    const body = JSON.stringify({
      users_name,
      avatar_url,
      body: comment,
      path: "",
    });
    const newPostResponse = await fetch(`${API}/comments/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (newPostResponse.status !== 201) {
      throw new Error("Unexpected response from server.");
    }
  };

  // TODO subscribe to notifications for new comments
  // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
});
