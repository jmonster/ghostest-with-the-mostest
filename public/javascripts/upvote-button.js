"use strict";

const e = React.createElement;

class UpvoteButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      commentid: props.commentid,
      upvotes: +props.upvotes, // total number of upvotes for the comment
      upvotePending: false, // true during the brief period between a user clicking the button and the server responding
    };
  }

  // persists upvotes to the server
  async submitUpvote() {
    const response = await fetch(`${API}/comments/upvote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: this.state.commentid,
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
          this.setState({
            upvotePending: true,
          });

          try {
            await this.submitUpvote();
            this.setState({ upvotes: this.state.upvotes + 1 });
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
