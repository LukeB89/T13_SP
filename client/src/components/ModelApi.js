import React, { useState } from "react";

const axios = require("axios");

export default function ModelApi(props) {
  const [message, setMessage] = useState({ message: "" });
  const [modelResponse, setModelResponse] = useState();

  React.useEffect(
    () => {
      if (parseInt(props.timeDayMonth) === 0) {
        // initial render should be nothing.
        return undefined;
      } else
        axios
          .get(`/api/model_result`, {
            params: {
              chosenTime: props.timeDayMonth[0],
              chosenDay: props.timeDayMonth[1],
              chosenMonth: props.timeDayMonth[2],
            },
          })
          .then((res) => {
            const modelResponse = res.data;
            setModelResponse(modelResponse);
            setMessage({
              message:
                "This journey is estimated to take " +
                modelResponse.model_response +
                " minutes",
            });

            console.log("setModelResponse has been triggered");
          });
    },
    // Listening for changes to props in order to
    // trigger a call to the API  to re-render the component.
    [props]
  );

  return (
    <div>
      <p>{message.message}</p>
    </div>
  );
}
