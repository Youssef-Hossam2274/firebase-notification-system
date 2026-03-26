export const subscribe = async (
  token: string,
  topic: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, topic }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const unsubscribe = async (
  token: string,
  topic: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch("/api/notifications/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, topic }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export default {
  subscribe,
  unsubscribe,
};
