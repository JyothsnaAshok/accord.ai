import { supabase } from "../services/@supabase.js";

export const loginRequired = async (req, res, next) => {
  try {
    const { user } = await supabase.auth.api.getUserByCookie(req);
    if (!user) {
      return res
        .status(401)
        .json({ message: "You should be logged in to access this data" });
    }
    next();
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
