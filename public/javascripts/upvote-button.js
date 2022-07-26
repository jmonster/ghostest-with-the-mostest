"use strict";

const e = React.createElement;

class UpvoteButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      commentID: props.commentID,
      upvotes: +props.upvotes, // total number of upvotes for the comment
      upvotePending: false, // true during the brief period between a user clicking the button and the server responding
    };

    // register our interest in notifications for the given commentID
    props.requestNotificationOnUpvote(this.state.commentID, (upvotes) => {
      // update the upvote count to match what was sent by the server
      this.setState({ upvotes });
    });
  }

  // persists upvotes to the server
  async submitUpvote() {
    const response = await fetch(`${API}/comments/upvote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: this.state.commentID,
        users_name: window.currentUser.users_name,
      }),
    });

    if (response.status === 409) {
      // when the current user has already upvoted this comment
      alert(
        `You (${window.currentUser.users_name}) may only upvote each comment once.`
      );
      throw new Error("Limit 1 upvote per user, per comment.");
    } else if (response.status > 299) {
      // some other unexpected failure
      throw new Error(
        `Failed due to error: ${response.status} ${response.statusText}`
      );
    }
  }

  render() {
    const triangleIcon = e("span", { className: "mr-1" }, "▲");

    return e(
      "button",
      {
        className: `mr-8 ${this.state.upvotePending ? "text-neutral-300" : ""}`,
        disabled: this.state.upvotePending,
        onClick: async () => {
          this.setState({ upvotePending: true });

          try {
            await this.submitUpvote();

            // The UI will be updated by the broadcast message that is reflected back from the server.
            // Mutating this value here would add a bit more code/complexity
            //
            // ...it's a UX improvement for V3 :)
          } catch (err) {
            console.error(err);
          } finally {
            this.setState({ upvotePending: false });
          }
        },
      },
      triangleIcon,
      `Upvote (${this.state.upvotes})`
    );
  }
}
