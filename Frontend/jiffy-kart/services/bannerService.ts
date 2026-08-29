import api from './axiosConfig';
import { Banner } from '../types';

export const BannerService = {
  getBanners: async (position: string = 'Home', cityId?: string, zoneId?: string | null): Promise<Banner[]> => {
    try {
      const response = await api.get('/public/banners', { params: { position, cityId, zoneId } });
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch banners", error);
      return [];
    }
  },

  getActiveBanners: async (position: string = 'Home', cityId?: string, zoneId?: string | null): Promise<Banner[]> => {
    return BannerService.getBanners(position, cityId, zoneId);
  }
};
