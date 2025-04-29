import axios from "axios";

const TENOR_API_KEY = process.env.REACT_APP_TENOR_API_KEY || "LIVDSRZULELA";
const TENOR_SEARCH_URL = "https://g.tenor.com/v1/search";

export const searchTenorGifs = async (query, limit = 12) => {
    const params = {
        key: TENOR_API_KEY,
        q: query,
        limit,
        media_filter: "minimal",
        contentfilter: "high",
    };
    const response = await axios.get(TENOR_SEARCH_URL, { params });
    return response.data.results.map(gif => ({
        id: gif.id,
        url: gif.media[0]?.tinygif?.url || gif.media[0]?.gif?.url,
        preview: gif.media[0]?.tinygif?.preview || gif.media[0]?.gif?.preview,
        title: gif.title || "",
    }));
};