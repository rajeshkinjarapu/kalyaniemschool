import api from '../api/axios';

export const qbApi = {
  // Questions API
  async getQuestions(filters: any = {}) {
    const res = await api.get('/api/questions', { params: filters });
    return res.data;
  },

  async getQuestionMeta() {
    const res = await api.get('/api/questions/meta');
    return res.data;
  },

  async getQuestion(id: number) {
    const res = await api.get(`/api/questions/${id}`);
    return res.data;
  },

  async createQuestion(data: any) {
    const res = await api.post('/api/questions', data);
    return res.data;
  },

  async updateQuestion(id: number, data: any) {
    const res = await api.put(`/api/questions/${id}`, data);
    return res.data;
  },

  async deleteQuestion(id: number) {
    const res = await api.delete(`/api/questions/${id}`);
    return res.data;
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/api/questions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async importQuestion(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async parseQuestionsWithAI(text: string, subject?: string, provider?: string, apiKey?: string) {
    const res = await api.post('/api/questions/import-ai', { text, subject, provider, apiKey });
    return res.data;
  },

  async bulkCreateQuestions(questions: any[]) {
    const res = await api.post('/api/questions/bulk', { questions });
    return res.data;
  },
  // Papers API
  async getPapers() {
    const res = await api.get('/api/papers');
    return res.data;
  },

  async getPaper(id: number) {
    const res = await api.get(`/api/papers/${id}`);
    return res.data;
  },

  async getPaperScrambled(id: number, set: string) {
    const res = await api.get(`/api/papers/${id}/scramble?set=${set}`);
    return res.data;
  },

  async createPaper(data: any) {
    const res = await api.post('/api/papers', data);
    return res.data;
  },

  async updatePaper(id: number, data: any) {
    const res = await api.put(`/api/papers/${id}`, data);
    return res.data;
  },

  async deletePaper(id: number) {
    const res = await api.delete(`/api/papers/${id}`);
    return res.data;
  },

  async exportPdf(html: string) {
    const res = await api.post('/api/papers/export-pdf', { html }, { responseType: 'blob' });
    return res.data;
  },

  // Templates API
  async getTemplates() {
    const res = await api.get('/api/templates');
    return res.data;
  },

  async getTemplate(id: number) {
    const res = await api.get(`/api/templates/${id}`);
    return res.data;
  },

  async createTemplate(data: any) {
    const res = await api.post('/api/templates', data);
    return res.data;
  },

  async updateTemplate(id: number, data: any) {
    const res = await api.put(`/api/templates/${id}`, data);
    return res.data;
  },

  async deleteTemplate(id: number) {
    const res = await api.delete(`/api/templates/${id}`);
    return res.data;
  },
};


