const API = "http://localhost:3000"; // url of the server managing comments and upvotes
const relativeTime = new RelativeTime(); // a Date formatting library
const commentSubscribers = {};

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

// render data into an template
function commentHtmlFromData(
  {
    id,
    path,
    users_name,
    avatar_url,
    created_at,
    body,
    upvote_count,
    children,
  },
  depth
) {
  const nestedComments = children.map((child) =>
    commentHtmlFromData(child, depth + 1)
  );

  return {
    id,
    path,
    html: `
    <div class="flex flex-col">
      <div class="flex flex-row my-4">
        <img src="${avatar_url}" class="rounded-full w-12 h-12 mr-4 z-10" />
        <div class="flex flex-col flex-auto ${
          children.length > 0 ? "border-l-2 -ml-10 pl-16" : ""
        }">
          <div class="flex items-center">
            <span class="darker-blue font-bold">${users_name}</span>
            <span class="dark-blue font-light text-sm">・${relativeTime.from(
              new Date(created_at)
            )}</span>
          </div>
          <p class="darker-blue my-1">${body}</p>
          <div class="flex font-bold dark-blue text-xs my-4">
            <div class="upvote-button-container" data-upvotes="${upvote_count}" data-commentid="${id}"></div>
            <button class="reply-toggle-button">Reply</button>
          </div>
          <div class="reply-composer-container"></div>
          ${nestedComments.reduce((acc, next) => acc + next.html, "")}
        </div>
      </div>
    </div>`,
  };
}

function requestNotificationOnUpvote(commentID, signaler) {
  commentSubscribers[commentID] = signaler;
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

  // listen for new comments
  const commentSource = new EventSource("/comments/broadcast");
  commentSource.addEventListener("message", ({ data }) => {
    // TODO validate data
    const { upvoteCount, commentID } = JSON.parse(data);
    const signaler = commentSubscribers[commentID];
    if (signaler) commentSubscribers[commentID](upvoteCount);
  });

  // render html blobs for each comment
  const commentsAsHtml = commentsAsJSON.map((json) => {
    return commentHtmlFromData(json, 0);
  });

  // add them to the DOM
  const commentsParent = window.document.getElementById("comments");
  commentsAsHtml.forEach(({ id, path, html }) => {
    // convert an html string to a DOM element
    const element = htmlToElement(html);

    const replyContainer = element.querySelector(".reply-composer-container");
    const replyToggleBtn = element.querySelector(".reply-toggle-button");

    function didClickReplyToggle() {
      // create the reply template and append it
      // attach the enter/return listener
      const submitReplyBtn = `<button id="submit-reply-btn" class="primary-btn ml-1 rounded text-white p-3 text-sm w-32 font-bold">Reply</button>`;
      const inputAsHtml = `<input id="new-comment-input" type="text" placeholder="What are your thoughts?" maxlength="280" class="flex-auto border border-solid border-neautral-200 p-2 rounded"></input>`;
      const btnAndInputContainer = `<div class="flex items-center"></div>`;
      const submitReplyAsElement = htmlToElement(submitReplyBtn);
      const inputAsElement = htmlToElement(inputAsHtml);
      const replyAsElement = htmlToElement(btnAndInputContainer);
      replyAsElement.appendChild(inputAsElement);
      replyAsElement.appendChild(submitReplyAsElement);
      replyContainer.appendChild(replyAsElement);

      submitReplyAsElement.onclick = async function () {
        // remove listener on submission
        submitReplyAsElement.onclick = () => {
          replyContainer.removeChild(replyAsElement);
        };

        // submit the comment and it's metadata
        // note: in a real system, some of these fields would be derived
        //       server-side from the logged in user's session
        const body = inputAsElement.value;
        const newPostResponse = await fetch(`${API}/comments/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            users_name,
            avatar_url,
            body,
            parentPath: path,
          }),
        });

        const data = await newPostResponse.json();
        data.created_at = new Date(data.created_at);

        // we know there can be only 1 result from 'commentHtmlFromData'
        const [{ html: newCommentAsHtml }] = commentHtmlFromData(data, 0);
        const newCommentAsElement = htmlToElement(newCommentAsHtml);
        element.after(newCommentAsElement);

        // consider non-201 responses as errors
        if (newPostResponse.status > 299) {
          throw new Error("Unexpected response from server.");
        }

        // remove the reply/input field
        replyContainer.removeChild(replyAsElement);
        // re-enable the reply toggle
        replyToggleBtn.onclick = didClickReplyToggle;
      };

      // allow the reply toggle button to hide/show the input fields
      replyToggleBtn.onclick = () => {
        replyContainer.removeChild(replyAsElement);
        replyToggleBtn.onclick = didClickReplyToggle;
      };
    }

    replyToggleBtn.onclick = didClickReplyToggle;

    // add comment element to the page
    commentsParent.appendChild(element);

    // UpvoteButton is a React Component defined in "public/javascripts/upvote-button.js"
    // and we're rendering it into the Comment element created above
    const btn = element.querySelector(".upvote-button-container");
    const { commentid, upvotes } = btn.dataset; // Read from the data-* attributes
    const root = ReactDOM.createRoot(btn);
    root.render(
      e(UpvoteButton, {
        commentID: commentid,
        upvotes,
        requestNotificationOnUpvote,
      })
    );
  });

  async function submitNewComment() {
    const comment = document.getElementById("new-comment-input").value;
    if (comment.length === 0) return; // skip empty comments

    const { html: commentAsHTML } = commentHtmlFromData(
      {
        users_name,
        avatar_url,
        created_at: Date.now(),
        body: comment,
      },
      0
    );

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
        // path is omitted here as this comment is not a reply to any other comment
      }),
    });

    // consider non-201 responses as errors
    if (newPostResponse.status !== 201) {
      // TODO cleanup UI
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
