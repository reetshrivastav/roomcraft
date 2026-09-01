const API_BASE_URL =
  "http://localhost:5000";

export async function getRoom(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch room details.");
  }

  return data;
}

export async function createRoom(
  roomData
) {
  const response = await fetch(
    `${API_BASE_URL}/rooms`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify(
        roomData
      )
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to create room."
    );
  }

  return data;
}

export async function generateLayouts(
  roomId
) {
  const response = await fetch(
    `${API_BASE_URL}/rooms/${roomId}/generate`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to generate layouts."
    );
  }

  return data;
}

export async function getRoomLayouts(
  roomId
) {
  const response = await fetch(
    `${API_BASE_URL}/rooms/${roomId}/layouts`
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch room layouts."
    );
  }

  return data;
}

export async function confirmLayout(
  roomId,
  layoutId
) {
  const response = await fetch(
    `${API_BASE_URL}/rooms/${roomId}/layouts/${layoutId}/confirm`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to confirm layout."
    );
  }

  return data;
}