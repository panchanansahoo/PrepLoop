import apiClient from "./apiClient";

export const notesApi = {
    /** GET /api/notes — all user notes */
    async getNotes() {
        const res = await apiClient.get("/api/notes");
        return res.data?.notes || res.data || [];
    },

    /** POST /api/notes — create a note */
    async createNote(data) {
        const res = await apiClient.post("/api/notes", data);
        return res.data;
    },

    /** PUT /api/notes/:id — update a note */
    async updateNote(id, data) {
        const res = await apiClient.put(`/api/notes/${id}`, data);
        return res.data;
    },

    /** DELETE /api/notes/:id — delete a note */
    async deleteNote(id) {
        const res = await apiClient.delete(`/api/notes/${id}`);
        return res.data;
    },

    /** GET /api/notes/bookmarks — all bookmarks */
    async getBookmarks() {
        const res = await apiClient.get("/api/notes/bookmarks");
        return res.data?.bookmarks || res.data || [];
    },

    /** POST /api/notes/bookmark — add bookmark */
    async addBookmark(data) {
        const res = await apiClient.post("/api/notes/bookmark", data);
        return res.data;
    },

    /** DELETE /api/notes/bookmark/:id — remove bookmark */
    async removeBookmark(id) {
        const res = await apiClient.delete(`/api/notes/bookmark/${id}`);
        return res.data;
    },

    /** PUT /api/notes/bookmark/:id/note — update bookmark note and tags */
    async updateBookmarkNote(id, data) {
        const res = await apiClient.put(`/api/notes/bookmark/${id}/note`, data);
        return res.data;
    },
};
