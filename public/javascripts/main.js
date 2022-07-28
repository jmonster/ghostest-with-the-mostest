(function () {
  const API = "http://localhost:3000"; // url of the server managing comments and upvotes
  const relativeTime = new RelativeTime(); // a Date formatting library
  const commentSubscribers = {};
  const threadedIndicatorClass = "border-l-2 -ml-10 pl-10";
  const anonymousUsers = [
    { name: "Lisa Simpson", avatar: "/images/lisa.jpg" },
    { name: "Bart Simpson", avatar: "/images/bart.jpg" },
    { name: "Marge Simpson", avatar: "/images/marge.jpg" },
    { name: "Homer Simpson", avatar: "/images/homer.jpg" },
  ];

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
  function htmlToElement(html, depth) {
    var template = document.createElement("template");
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }

  // render a comment (but not it's children) as html
  // includes a `nested-comments` tag for appending reply comments
  function commentHtmlFromData(
    { id, path, users_name, avatar_url, created_at, body, upvote_count },
    isRoot,
    hasChildren
  ) {
    const relativeTimeAgo = relativeTime.from(new Date(created_at));
    const html = `
    <div class="flex flex-col sub-comment mt-6 ">
      <div class="flex flex-row">
        <img src="${avatar_url}" class="rounded-full w-10 h-10 mr-4 z-10 bg-white" />
        <div class="flex flex-col flex-auto threaded ${
          hasChildren ? threadedIndicatorClass : ""
        }">
          <div class="flex items-center">
            <span class="darker-blue font-bold">${users_name}</span>
            <span class="dark-blue font-light text-sm">・${relativeTimeAgo}</span>
          </div>
          <p class="darker-blue my-1">${body}</p>
          <div class="flex font-bold dark-blue text-xs mt-2">
            <div class="upvote-button-container" data-upvotes="${upvote_count}" data-commentid="${id}"></div>
            ${
              // note: remove this conditional to support arbitrarly nested Replies
              isRoot ? '<button class="reply-toggle-button">Reply</button>' : ""
            }
          </div>
          <div class="reply-composer-container"></div>
          <div class="nested-comments"></div>
        </div>
      </div>
    </div>`;

    return createCommentElement({ html, parentPath: path });
  }

  function registerForNotificationOnUpvote(commentID, signaler) {
    commentSubscribers[commentID] = signaler;
  }

  function renderUpvoteComponent(context, btnContainerSelector) {
    const btn = context.querySelector(btnContainerSelector);
    const { commentid, upvotes } = btn.dataset; // Read from the data-* attributes
    const root = ReactDOM.createRoot(btn);
    root.render(
      e(UpvoteButton, {
        api: API,
        commentID: commentid,
        upvotes,
        registerForNotificationOnUpvote,
      })
    );
  }

  function createNestedCommentElement(data, depth) {
    const { children } = data;
    const nestedComments = children
      ? children.map((child) => createNestedCommentElement(child, depth + 1))
      : [];
    const commentElement = commentHtmlFromData(
      data,
      depth === 0,
      nestedComments.length > 0
    );
    const nestedCommentContainer =
      commentElement.querySelector(".nested-comments");

    // append nested comments to appropriate node
    nestedComments.map((nc) => nestedCommentContainer.appendChild(nc));

    return commentElement;
  }

  async function submitResponse(
    commentElement,
    inputAsElement,
    parentPath,
    replyContainer,
    replyAsElement,
    replyToggleBtn
  ) {
    if (inputAsElement.value.length === 0) return;
    // TODO show pending indicator

    // submit the comment and it's metadata
    // note: in a real system, some of these fields would be derived
    //       server-side from the logged in user's session
    const newPostResponse = await fetch(`${API}/comments/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        users_name: window.currentUser.users_name,
        avatar_url: window.currentUser.avatar_url,
        body: inputAsElement.value,
        parentPath,
      }),
    });

    // TODO remove pending indicator

    // consider non-2XX responses as errors
    if (newPostResponse.status > 299) {
      // revert UI changes (if there were any)
      // TODO provide a better UX on errors
      throw new Error("Unexpected response from server.");
    }

    // parse the response
    const data = await newPostResponse.json();

    // deserialize created_at
    data.created_at = new Date(data.created_at);

    // append this response inside the current comment
    const newCommentAsElement = commentHtmlFromData(data, false, false);
    commentElement
      .querySelector(".nested-comments")
      .append(newCommentAsElement);

    // update the UI to reflect that the parent comment now has children
    const threadIndicator = commentElement.querySelector(".threaded");
    threadedIndicatorClass
      .split(/\s+/g) // split on whitespace
      .forEach(
        (className) =>
          className &&
          className.length > 0 &&
          threadIndicator.classList.add(className)
      );

    // remove the reply/input field
    replyContainer.removeChild(replyAsElement);

    // re-enable the reply toggle
    replyToggleBtn.onclick = () =>
      didClickReplyToggle(commentElement, replyToggleBtn, parentPath);
  }

  function didClickReplyToggle(commentElement, replyToggleBtn, parentPath) {
    // create the reply template
    const submitReplyBtn = `<button id="submit-reply-btn" class="primary-btn ml-1 rounded text-white p-3 text-sm w-32 font-bold">Reply</button>`;
    const inputAsHtml = `<input id="new-comment-input" type="text" placeholder="What are your thoughts?" maxlength="280" class="flex-auto border border-solid border-neautral-200 p-2 rounded"></input>`;
    const btnAndInputContainer = `<div class="flex items-center mt-4  mb-8"></div>`;
    const submitReplyAsElement = htmlToElement(submitReplyBtn);
    const inputAsElement = htmlToElement(inputAsHtml);
    const replyAsElement = htmlToElement(btnAndInputContainer);

    // remove the reply/compose UI if the user presses Escape
    inputAsElement.onkeyup = ({ code }) => {
      if (code === "Escape") {
        // remove reply composing UI
        replyContainer.removeChild(replyAsElement);
        replyToggleBtn.onclick = () =>
          didClickReplyToggle(commentElement, replyToggleBtn, parentPath);
      } else if (code === "Enter") {
        // submit
        submitResponse(
          commentElement,
          inputAsElement,
          parentPath,
          replyContainer,
          replyAsElement,
          replyToggleBtn
        );
      }
    };

    // combine elements
    replyAsElement.appendChild(inputAsElement);
    replyAsElement.appendChild(submitReplyAsElement);

    // add reply UI to the DOM
    const replyContainer = commentElement.querySelector(
      ".reply-composer-container"
    );
    replyContainer.appendChild(replyAsElement);

    // when a user clicks on the Reply button
    // - submit the data to the server
    // - render the resulting comment
    // - remove the reply composition UI elements
    submitReplyAsElement.onclick = () =>
      submitResponse(
        commentElement,
        inputAsElement,
        parentPath,
        replyContainer,
        replyAsElement,
        replyToggleBtn
      );

    // allow the reply toggle button to hide/show the input fields
    replyToggleBtn.onclick = () => {
      replyContainer.removeChild(replyAsElement);
      replyToggleBtn.onclick = () =>
        didClickReplyToggle(commentElement, replyToggleBtn, parentPath);
    };

    // set focus to the input field
    inputAsElement.focus();
  }

  function createCommentElement({ parentPath, html }) {
    // html string => DOM element
    const commentElement = htmlToElement(html);

    // query for the comment's UI contorls
    const replyToggleBtn = commentElement.querySelector(".reply-toggle-button");

    // listen to 'Reply' clicks/taps
    if (replyToggleBtn) {
      replyToggleBtn.onclick = () =>
        didClickReplyToggle(commentElement, replyToggleBtn, parentPath);
    }

    // UpvoteButton is a React Component defined in "public/javascripts/upvote-button.js"
    // and we add it to our Comment here
    renderUpvoteComponent(commentElement, ".upvote-button-container");

    return commentElement;
  }

  async function submitNewRootComment(commentsParent) {
    const comment = document.getElementById("new-comment-input").value;
    if (comment.length === 0) return; // skip empty comments

    // submit the comment and it's metadata
    // note: in a real system, some of these fields would be derived
    //       server-side from the logged in user's session
    const newPostResponse = await fetch(`${API}/comments/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        users_name: window.currentUser.users_name,
        avatar_url: window.currentUser.avatar_url,
        body: comment,
        // path is omitted here as this comment is not a reply to any other comment
      }),
    });

    // consider non-201 responses as errors
    if (newPostResponse.status > 299) {
      throw new Error("Unexpected response from server.");
    }

    // create html/element from data
    const data = await newPostResponse.json();
    const commentElement = commentHtmlFromData(data, true, false);

    // add comment to DOM
    commentsParent.appendChild(commentElement);

    // reset new comment's input field to blank
    document.getElementById("new-comment-input").value = "";
  }

  onDocumentReady(async function () {
    // select a random user on page load
    const randomIdx = Math.floor(Math.random() * anonymousUsers.length);
    const users_name = anonymousUsers[randomIdx].name;
    const avatar_url = anonymousUsers[randomIdx].avatar;
    window.currentUser = { users_name, avatar_url };

    // display the currentUer's avatar
    document
      .getElementById("anonymous-user-avatar")
      .setAttribute("src", avatar_url);

    // fetch comments from the server
    const commentsAsJSON = await (await fetch(`${API}/comments`)).json();

    // listen for new comments from the server
    const commentSource = new EventSource("/comments/broadcast");
    commentSource.addEventListener("message", ({ data }) => {
      // TODO validate data
      const { upvoteCount, commentID } = JSON.parse(data);
      const signaler = commentSubscribers[commentID];
      if (signaler) commentSubscribers[commentID](upvoteCount);
    });

    // create comment threads (i.e. children included)
    const depth = 0;
    const commentsAsElements = commentsAsJSON.map((json) =>
      createNestedCommentElement(json, depth)
    );

    // add comment threads to the DOM
    const commentsParent = window.document.getElementById("comments");
    commentsAsElements.map((element) => commentsParent.appendChild(element));

    // listen for submit button clicks
    const submitBtn = document.getElementById("submitCommentBtn");
    submitBtn.onclick = () => {
      submitNewRootComment(commentsParent);
    };

    // listen for Enter/Return key while composing a comment
    document.getElementById("new-comment-input").onkeyup = ({ code }) => {
      if (code === "Enter") submitNewRootComment(commentsParent);
    };
  });
})();
