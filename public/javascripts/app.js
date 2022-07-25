const API = "http://localhost:3000"; // url of the server managing comments and upvotes
const relativeTime = new RelativeTime(); // a Date formatting library

// onDocumentReady -- executes the passed-in function (fn) when the DOM is ready
// compliments of https://stackoverflow.com/a/9899701
function onDocumentReady(fn) {
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

// htmlToElement -- converts an HTML string to a DOM element
// caveat: returns only the first node
// compliments of https://stackoverflow.com/a/35385518
function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function incrementUpvoteCount(id) {}

// submits upvote to the server
// on success, updates the UI to reflect the new value
async function submitUpvote(id) {
  const response = await fetch(`${API}/comments/upvote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, users_name: window.currentUser.users_name }),
  });

  if (response.status === 409) {
    return alert(
      `You (${window.currentUser.users_name}) may only upvote each comment once.`
    );
  } else if (response.status > 299) {
    throw new Error(
      `Failed to upvote due to network error: ${response.status} ${response.statusText}`
    );
  }

  // update local UI to reflect change
  // note: each element has an id of the form "btn-upvote-6d754120-b79f-4467-970f-0dabba18bb4f"
  const el = document.getElementById(`btn-upvote-${id}`);
  const prevValue = +el.getAttribute("data-upvotes");

  // update the ui to reflect the new value
  el.innerHTML = prevValue ? `(${prevValue + 1})` : "(1)";
}

// render data into an template
function htmlFromData({
  id,
  users_name,
  avatar_url,
  created_at,
  body,
  upvote_count,
}) {
  const renderedUpvoteCount = upvote_count > 0 ? `(${upvote_count})` : "";

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
            <span>Upvote <span id="btn-upvote-${id}" data-upvotes="${upvote_count}">${renderedUpvoteCount}</span></span>
          </span>
          <span>Reply</span>
        </div>
      </div>
    </div>`;
}

onDocumentReady(async function () {
  // select a random user on each page load
  const anonymousUsers = [
    { name: "Lisa Simpson", avatar: "/images/lisa.jpg" },
    { name: "Bart Simpson", avatar: "/images/bart.jpg" },
    { name: "Marge Simpson", avatar: "/images/marge.jpg" },
    { name: "Homer Simpson", avatar: "/images/homer.jpg" },
  ];
  const randomIdx = Math.floor(Math.random() * anonymousUsers.length);
  const users_name = anonymousUsers[randomIdx].name;
  const avatar_url = anonymousUsers[randomIdx].avatar;
  window.currentUser = { users_name, avatar_url };

  // display the current user's avatar
  document
    .getElementById("anonymous-user-avatar")
    .setAttribute("src", avatar_url);

  // fetch comments from the server
  const commentsAsJSON = await (await fetch(`${API}/comments`)).json();

  // render html blobs for each comment
  const commentsAsHtml = commentsAsJSON.map(htmlFromData);

  // add them to the DOM
  const commentsParent = window.document.getElementById("comments");
  commentsAsHtml.forEach((el) => commentsParent.appendChild(htmlToElement(el)));

  async function submitNewComment() {
    const comment = document.getElementById("new-comment-input").value;
    if (comment.length === 0) return; // skip empty comments

    const commentAsHTML = htmlFromData({
      users_name,
      avatar_url,
      created_at: Date.now(),
      body: comment,
    });
    const commentElement = htmlToElement(commentAsHTML);

    // add comment to DOM
    commentsParent.appendChild(commentElement);

    // reset new comment's input field to blank
    document.getElementById("new-comment-input").value = "";

    // submit the comment and it's metadata
    // note: in a real system, some of these fields would be derived
    //       server-side from the logged in user's session
    const newPostResponse = await fetch(`${API}/comments/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        users_name,
        avatar_url,
        body: comment,
        path: "",
      }),
    });

    // consider non-201 responses as errors
    if (newPostResponse.status !== 201) {
      throw new Error("Unexpected response from server.");
    }
  }

  // listen for submit button clicks
  const submitBtn = document.getElementById("submitCommentBtn");
  submitBtn.onclick = submitNewComment;

  // listen for Enter/Return key while composing a comment
  document.getElementById("new-comment-input").onkeyup = ({ code }) => {
    if (code === "Enter") submitNewComment();
  };

  // TODO subscribe to notifications for new comments
  // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
});
