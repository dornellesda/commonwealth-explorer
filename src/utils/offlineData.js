import countryData from '../data/country_data.json';

export function getOfflineWikiData(countryName) {
  return countryData[countryName]?.wiki || null;
}

export function getOfflineImages(countryName) {
  return countryData[countryName]?.images || [];
}

export function getOfflineFamilySearch(countryName) {
  return countryData[countryName]?.familySearch || [];
}
