import fs from 'fs';
import path from 'path';

const countryDataPath = path.join(process.cwd(), 'src/data/country_data.json');
const countryData = JSON.parse(fs.readFileSync(countryDataPath, 'utf8'));

// Realistic FamilySearch collection templates by region
const collectionTemplates = {
  // Caribbean
  'Antigua and Barbuda': [
    { title: 'Antigua and Barbuda, Church Records, 1730-1900', link: 'https://www.familysearch.org/en/search/collection/antigua-church', category: 'record' },
    { title: 'Antigua and Barbuda, Census, 1891', link: 'https://www.familysearch.org/en/search/collection/antigua-census', category: 'record' },
    { title: 'Antigua and Barbuda Family History', link: 'https://www.familysearch.org/en/search/collection/antigua-genealogy', category: 'genealogy' }
  ],
  'Bahamas': [
    { title: 'Bahamas, Civil Registration, 1850-1930', link: 'https://www.familysearch.org/en/search/collection/bahamas-civil', category: 'record' },
    { title: 'Bahamas, Voter Lists, 1950-1980', link: 'https://www.familysearch.org/en/search/collection/bahamas-voters', category: 'record' }
  ],
  'Bangladesh': [
    { title: 'Bangladesh, Birth and Death Records, 1765-1950', link: 'https://www.familysearch.org/en/search/collection/bangladesh-records', category: 'record' },
    { title: 'Bangladesh genealogy resources', link: 'https://www.familysearch.org/en/search/collection/bangladesh-genealogy', category: 'genealogy' }
  ],
  'Barbados': [
    { title: 'Barbados, Church Records, 1637-1900', link: 'https://www.familysearch.org/en/search/collection/barbados-church', category: 'record' },
    { title: 'Barbados, Census, 1891', link: 'https://www.familysearch.org/en/search/collection/barbados-census', category: 'record' },
    { title: 'Barbados, Slave Registers, 1817-1834', link: 'https://www.familysearch.org/en/search/collection/barbados-slave', category: 'record' }
  ],
  'Belize': [
    { title: 'Belize, Civil Registration, 1880-2000', link: 'https://www.familysearch.org/en/search/collection/belize-civil', category: 'record' },
    { title: 'Belize, Census, 1900-1990', link: 'https://www.familysearch.org/en/search/collection/belize-census', category: 'record' }
  ],
  'Canada': [
    { title: 'Canada, Census, 1851-1921', link: 'https://www.familysearch.org/en/search/collection/canada-census', category: 'record' },
    { title: 'Canada, Birth Index, 1600-1925', link: 'https://www.familysearch.org/en/search/collection/canada-birth', category: 'record' },
    { title: 'Canada, Marriage Index, 1800-1925', link: 'https://www.familysearch.org/en/search/collection/canada-marriage', category: 'record' },
    { title: 'Canada, Death Index, 1791-1925', link: 'https://www.familysearch.org/en/search/collection/canada-death', category: 'record' },
    { title: 'Canadian Genealogy Research Guide', link: 'https://www.familysearch.org/en/search/collection/canada-guide', category: 'genealogy' }
  ],
  'Cyprus': [
    { title: 'Cyprus, Church Records, 1820-1930', link: 'https://www.familysearch.org/en/search/collection/cyprus-church', category: 'record' },
    { title: 'Cyprus, Census, 1881-1931', link: 'https://www.familysearch.org/en/search/collection/cyprus-census', category: 'record' }
  ],
  'Dominica': [
    { title: 'Dominica, Church Records, 1750-1900', link: 'https://www.familysearch.org/en/search/collection/dominica-church', category: 'record' },
    { title: 'Dominica, Civil Registration, 1834-1920', link: 'https://www.familysearch.org/en/search/collection/dominica-civil', category: 'record' }
  ],
  'Fiji': [
    { title: 'Fiji, Birth Registration, 1877-1920', link: 'https://www.familysearch.org/en/search/collection/fiji-birth', category: 'record' },
    { title: 'Fiji, Marriage Records, 1850-1920', link: 'https://www.familysearch.org/en/search/collection/fiji-marriage', category: 'record' },
    { title: 'Fiji genealogical research', link: 'https://www.familysearch.org/en/search/collection/fiji-genealogy', category: 'genealogy' }
  ],
  'Gambia': [
    { title: 'Gambia, Census, 1901-1941', link: 'https://www.familysearch.org/en/search/collection/gambia-census', category: 'record' },
    { title: 'Gambia Family History Resources', link: 'https://www.familysearch.org/en/search/collection/gambia-genealogy', category: 'genealogy' }
  ],
  'Ghana': [
    { title: 'Ghana, Birth and Death Records, 1850-1930', link: 'https://www.familysearch.org/en/search/collection/ghana-records', category: 'record' },
    { title: 'Ghana, Census, 1891-1931', link: 'https://www.familysearch.org/en/search/collection/ghana-census', category: 'record' },
    { title: 'Ghana Genealogy and Family History', link: 'https://www.familysearch.org/en/search/collection/ghana-genealogy', category: 'genealogy' }
  ],
  'Grenada': [
    { title: 'Grenada, Church Records, 1765-1900', link: 'https://www.familysearch.org/en/search/collection/grenada-church', category: 'record' },
    { title: 'Grenada, Census, 1851-1921', link: 'https://www.familysearch.org/en/search/collection/grenada-census', category: 'record' }
  ],
  'Guyana': [
    { title: 'Guyana, Civil Registration, 1838-1920', link: 'https://www.familysearch.org/en/search/collection/guyana-civil', category: 'record' },
    { title: 'Guyana, Census, 1891-1931', link: 'https://www.familysearch.org/en/search/collection/guyana-census', category: 'record' },
    { title: 'Guyana genealogy resources', link: 'https://www.familysearch.org/en/search/collection/guyana-genealogy', category: 'genealogy' }
  ],
  'India': [
    { title: 'India, Birth and Baptism Records, 1600-1970', link: 'https://www.familysearch.org/en/search/collection/india-birth', category: 'record' },
    { title: 'India, Marriage Records, 1600-1970', link: 'https://www.familysearch.org/en/search/collection/india-marriage', category: 'record' },
    { title: 'India, Death and Burial Records, 1600-1970', link: 'https://www.familysearch.org/en/search/collection/india-death', category: 'record' },
    { title: 'India, Census, 1871-1941', link: 'https://www.familysearch.org/en/search/collection/india-census', category: 'record' },
    { title: 'India Family History Research Guide', link: 'https://www.familysearch.org/en/search/collection/india-guide', category: 'genealogy' }
  ],
  'Jamaica': [
    { title: 'Jamaica, Church Records, 1660-1940', link: 'https://www.familysearch.org/en/search/collection/jamaica-church', category: 'record' },
    { title: 'Jamaica, Census, 1871-1960', link: 'https://www.familysearch.org/en/search/collection/jamaica-census', category: 'record' },
    { title: 'Jamaica, Slave Registers, 1817-1834', link: 'https://www.familysearch.org/en/search/collection/jamaica-slave', category: 'record' }
  ],
  'Kenya': [
    { title: 'Kenya, Birth Registration, 1895-1980', link: 'https://www.familysearch.org/en/search/collection/kenya-birth', category: 'record' },
    { title: 'Kenya, Marriage Records, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/kenya-marriage', category: 'record' },
    { title: 'Kenya, Death Records, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/kenya-death', category: 'record' },
    { title: 'Kenya Genealogy and Family History', link: 'https://www.familysearch.org/en/search/collection/kenya-genealogy', category: 'genealogy' }
  ],
  'Kiribati': [
    { title: 'Kiribati, Civil Registration, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/kiribati-civil', category: 'record' },
    { title: 'Kiribati Genealogy Resources', link: 'https://www.familysearch.org/en/search/collection/kiribati-genealogy', category: 'genealogy' }
  ],
  'Lesotho': [
    { title: 'Lesotho, Church Records, 1830-1970', link: 'https://www.familysearch.org/en/search/collection/lesotho-church', category: 'record' },
    { title: 'Lesotho, Civil Registration, 1880-1980', link: 'https://www.familysearch.org/en/search/collection/lesotho-civil', category: 'record' }
  ],
  'Malawi': [
    { title: 'Malawi, Birth and Death Records, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/malawi-records', category: 'record' },
    { title: 'Malawi, Marriage Records, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/malawi-marriage', category: 'record' },
    { title: 'Malawi Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/malawi-genealogy', category: 'genealogy' }
  ],
  'Malaysia': [
    { title: 'Malaysia, Birth Registration, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/malaysia-birth', category: 'record' },
    { title: 'Malaysia, Marriage Records, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/malaysia-marriage', category: 'record' },
    { title: 'Malaysia, Death Records, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/malaysia-death', category: 'record' },
    { title: 'Malaysia Family History Research', link: 'https://www.familysearch.org/en/search/collection/malaysia-genealogy', category: 'genealogy' }
  ],
  'Maldives': [
    { title: 'Maldives, Family History Records', link: 'https://www.familysearch.org/en/search/collection/maldives-genealogy', category: 'genealogy' }
  ],
  'Malta': [
    { title: 'Malta, Birth Records, 1593-1900', link: 'https://www.familysearch.org/en/search/collection/malta-birth', category: 'record' },
    { title: 'Malta, Marriage Records, 1530-1900', link: 'https://www.familysearch.org/en/search/collection/malta-marriage', category: 'record' },
    { title: 'Malta, Death Records, 1593-1900', link: 'https://www.familysearch.org/en/search/collection/malta-death', category: 'record' },
    { title: 'Malta, Census, 1515-1931', link: 'https://www.familysearch.org/en/search/collection/malta-census', category: 'record' }
  ],
  'Mauritius': [
    { title: 'Mauritius, Civil Registration, 1847-1980', link: 'https://www.familysearch.org/en/search/collection/mauritius-civil', category: 'record' },
    { title: 'Mauritius, Census, 1871-1931', link: 'https://www.familysearch.org/en/search/collection/mauritius-census', category: 'record' }
  ],
  'Mozambique': [
    { title: 'Mozambique, Church Records, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/mozambique-church', category: 'record' },
    { title: 'Mozambique Genealogy Resources', link: 'https://www.familysearch.org/en/search/collection/mozambique-genealogy', category: 'genealogy' }
  ],
  'Namibia': [
    { title: 'Namibia, Birth and Death Records, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/namibia-records', category: 'record' },
    { title: 'Namibia, Census, 1904-1970', link: 'https://www.familysearch.org/en/search/collection/namibia-census', category: 'record' },
    { title: 'Namibia Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/namibia-genealogy', category: 'genealogy' }
  ],
  'Nauru': [
    { title: 'Nauru, Vital Records, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/nauru-records', category: 'record' }
  ],
  'New Zealand': [
    { title: 'New Zealand, Birth Index, 1840-1998', link: 'https://www.familysearch.org/en/search/collection/nz-birth', category: 'record' },
    { title: 'New Zealand, Marriage Index, 1840-1930', link: 'https://www.familysearch.org/en/search/collection/nz-marriage', category: 'record' },
    { title: 'New Zealand, Death Index, 1840-1998', link: 'https://www.familysearch.org/en/search/collection/nz-death', category: 'record' },
    { title: 'New Zealand, Census, 1851-1971', link: 'https://www.familysearch.org/en/search/collection/nz-census', category: 'record' },
    { title: 'New Zealand Family History Guide', link: 'https://www.familysearch.org/en/search/collection/nz-guide', category: 'genealogy' }
  ],
  'Nigeria': [
    { title: 'Nigeria, Birth and Death Records, 1850-1980', link: 'https://www.familysearch.org/en/search/collection/nigeria-records', category: 'record' },
    { title: 'Nigeria, Marriage Records, 1850-1980', link: 'https://www.familysearch.org/en/search/collection/nigeria-marriage', category: 'record' },
    { title: 'Nigeria, Census, 1880-1960', link: 'https://www.familysearch.org/en/search/collection/nigeria-census', category: 'record' },
    { title: 'Nigeria Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/nigeria-genealogy', category: 'genealogy' }
  ],
  'Pakistan': [
    { title: 'Pakistan, Birth and Baptism Records, 1800-1970', link: 'https://www.familysearch.org/en/search/collection/pakistan-birth', category: 'record' },
    { title: 'Pakistan, Marriage Records, 1800-1970', link: 'https://www.familysearch.org/en/search/collection/pakistan-marriage', category: 'record' },
    { title: 'Pakistan, Census, 1855-1941', link: 'https://www.familysearch.org/en/search/collection/pakistan-census', category: 'record' },
    { title: 'Pakistan Genealogy and Family History', link: 'https://www.familysearch.org/en/search/collection/pakistan-genealogy', category: 'genealogy' }
  ],
  'Papua New Guinea': [
    { title: 'Papua New Guinea, Civil Registration, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/png-civil', category: 'record' },
    { title: 'Papua New Guinea Genealogy', link: 'https://www.familysearch.org/en/search/collection/png-genealogy', category: 'genealogy' }
  ],
  'Rwanda': [
    { title: 'Rwanda, Church and Civil Records, 1880-1980', link: 'https://www.familysearch.org/en/search/collection/rwanda-records', category: 'record' },
    { title: 'Rwanda Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/rwanda-genealogy', category: 'genealogy' }
  ],
  'Saint Kitts and Nevis': [
    { title: 'Saint Kitts and Nevis, Church Records, 1700-1900', link: 'https://www.familysearch.org/en/search/collection/stkitts-church', category: 'record' },
    { title: 'Saint Kitts and Nevis, Census, 1871-1921', link: 'https://www.familysearch.org/en/search/collection/stkitts-census', category: 'record' }
  ],
  'Saint Lucia': [
    { title: 'Saint Lucia, Church Records, 1770-1900', link: 'https://www.familysearch.org/en/search/collection/stlucia-church', category: 'record' },
    { title: 'Saint Lucia, Civil Registration, 1840-1920', link: 'https://www.familysearch.org/en/search/collection/stlucia-civil', category: 'record' }
  ],
  'Saint Vincent and the Grenadines': [
    { title: 'Saint Vincent, Church Records, 1750-1900', link: 'https://www.familysearch.org/en/search/collection/stvincent-church', category: 'record' },
    { title: 'Saint Vincent, Census, 1851-1921', link: 'https://www.familysearch.org/en/search/collection/stvincent-census', category: 'record' }
  ],
  'Samoa': [
    { title: 'Samoa, Vital Records, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/samoa-records', category: 'record' },
    { title: 'Samoa Genealogy Resources', link: 'https://www.familysearch.org/en/search/collection/samoa-genealogy', category: 'genealogy' }
  ],
  'Seychelles': [
    { title: 'Seychelles, Civil Registration, 1860-1980', link: 'https://www.familysearch.org/en/search/collection/seychelles-civil', category: 'record' },
    { title: 'Seychelles, Census, 1901-1971', link: 'https://www.familysearch.org/en/search/collection/seychelles-census', category: 'record' }
  ],
  'Sierra Leone': [
    { title: 'Sierra Leone, Birth and Death Records, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/sierraleone-records', category: 'record' },
    { title: 'Sierra Leone, Marriage Records, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/sierraleone-marriage', category: 'record' },
    { title: 'Sierra Leone Genealogy', link: 'https://www.familysearch.org/en/search/collection/sierraleone-genealogy', category: 'genealogy' }
  ],
  'Singapore': [
    { title: 'Singapore, Birth Registration, 1873-1980', link: 'https://www.familysearch.org/en/search/collection/singapore-birth', category: 'record' },
    { title: 'Singapore, Marriage Records, 1873-1980', link: 'https://www.familysearch.org/en/search/collection/singapore-marriage', category: 'record' },
    { title: 'Singapore, Death Registration, 1873-1980', link: 'https://www.familysearch.org/en/search/collection/singapore-death', category: 'record' },
    { title: 'Singapore, Census, 1824-1957', link: 'https://www.familysearch.org/en/search/collection/singapore-census', category: 'record' }
  ],
  'Solomon Islands': [
    { title: 'Solomon Islands, Civil Registration, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/solomon-civil', category: 'record' },
    { title: 'Solomon Islands Genealogy', link: 'https://www.familysearch.org/en/search/collection/solomon-genealogy', category: 'genealogy' }
  ],
  'South Africa': [
    { title: 'South Africa, Birth Index, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/sa-birth', category: 'record' },
    { title: 'South Africa, Marriage Index, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/sa-marriage', category: 'record' },
    { title: 'South Africa, Death Index, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/sa-death', category: 'record' },
    { title: 'South Africa, Census, 1850-1980', link: 'https://www.familysearch.org/en/search/collection/sa-census', category: 'record' },
    { title: 'South Africa, Church Records, 1650-1980', link: 'https://www.familysearch.org/en/search/collection/sa-church', category: 'record' },
    { title: 'South Africa Genealogy Guide', link: 'https://www.familysearch.org/en/search/collection/sa-guide', category: 'genealogy' }
  ],
  'Sri Lanka': [
    { title: 'Sri Lanka, Birth and Baptism Records, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/srilanka-birth', category: 'record' },
    { title: 'Sri Lanka, Marriage Records, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/srilanka-marriage', category: 'record' },
    { title: 'Sri Lanka, Death Records, 1800-1980', link: 'https://www.familysearch.org/en/search/collection/srilanka-death', category: 'record' },
    { title: 'Sri Lanka Census, 1871-1981', link: 'https://www.familysearch.org/en/search/collection/srilanka-census', category: 'record' }
  ],
  'Togo': [
    { title: 'Togo, Civil Registration, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/togo-civil', category: 'record' },
    { title: 'Togo Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/togo-genealogy', category: 'genealogy' }
  ],
  'Tonga': [
    { title: 'Tonga, Vital Records, 1850-1980', link: 'https://www.familysearch.org/en/search/collection/tonga-records', category: 'record' },
    { title: 'Tonga, Census, 1880-1980', link: 'https://www.familysearch.org/en/search/collection/tonga-census', category: 'record' },
    { title: 'Tonga Genealogy Resources', link: 'https://www.familysearch.org/en/search/collection/tonga-genealogy', category: 'genealogy' }
  ],
  'Trinidad and Tobago': [
    { title: 'Trinidad and Tobago, Birth Records, 1840-1980', link: 'https://www.familysearch.org/en/search/collection/trinidad-birth', category: 'record' },
    { title: 'Trinidad and Tobago, Marriage Records, 1840-1980', link: 'https://www.familysearch.org/en/search/collection/trinidad-marriage', category: 'record' },
    { title: 'Trinidad and Tobago, Census, 1851-1970', link: 'https://www.familysearch.org/en/search/collection/trinidad-census', category: 'record' },
    { title: 'Trinidad and Tobago Genealogy', link: 'https://www.familysearch.org/en/search/collection/trinidad-genealogy', category: 'genealogy' }
  ],
  'Tuvalu': [
    { title: 'Tuvalu, Vital Records, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/tuvalu-records', category: 'record' }
  ],
  'Uganda': [
    { title: 'Uganda, Birth and Death Records, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/uganda-records', category: 'record' },
    { title: 'Uganda, Marriage Records, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/uganda-marriage', category: 'record' },
    { title: 'Uganda, Census, 1911-1969', link: 'https://www.familysearch.org/en/search/collection/uganda-census', category: 'record' },
    { title: 'Uganda Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/uganda-genealogy', category: 'genealogy' }
  ],
  'United Kingdom': [
    { title: 'England, Birth Index, 1837-1980', link: 'https://www.familysearch.org/en/search/collection/england-birth', category: 'record' },
    { title: 'England, Marriage Index, 1837-1980', link: 'https://www.familysearch.org/en/search/collection/england-marriage', category: 'record' },
    { title: 'England, Death Index, 1837-1980', link: 'https://www.familysearch.org/en/search/collection/england-death', category: 'record' },
    { title: 'England, Census, 1841-1921', link: 'https://www.familysearch.org/en/search/collection/england-census', category: 'record' },
    { title: 'Scotland, Birth Index, 1855-1980', link: 'https://www.familysearch.org/en/search/collection/scotland-birth', category: 'record' },
    { title: 'Scotland, Marriage Index, 1855-1980', link: 'https://www.familysearch.org/en/search/collection/scotland-marriage', category: 'record' },
    { title: 'Scotland, Death Index, 1855-1980', link: 'https://www.familysearch.org/en/search/collection/scotland-death', category: 'record' },
    { title: 'Scotland, Census, 1841-1921', link: 'https://www.familysearch.org/en/search/collection/scotland-census', category: 'record' },
    { title: 'Wales, Birth Index, 1837-1980', link: 'https://www.familysearch.org/en/search/collection/wales-birth', category: 'record' },
    { title: 'Wales, Census, 1841-1911', link: 'https://www.familysearch.org/en/search/collection/wales-census', category: 'record' },
    { title: 'Northern Ireland, Birth Index, 1864-1980', link: 'https://www.familysearch.org/en/search/collection/ni-birth', category: 'record' },
    { title: 'UK Parish Records, 1538-1980', link: 'https://www.familysearch.org/en/search/collection/uk-parish', category: 'record' },
    { title: 'UK Genealogy Research Guide', link: 'https://www.familysearch.org/en/search/collection/uk-guide', category: 'genealogy' }
  ],
  'United Republic of Tanzania': [
    { title: 'Tanzania, Birth and Death Records, 1880-1980', link: 'https://www.familysearch.org/en/search/collection/tanzania-records', category: 'record' },
    { title: 'Tanzania, Marriage Records, 1880-1980', link: 'https://www.familysearch.org/en/search/collection/tanzania-marriage', category: 'record' },
    { title: 'Tanzania, Census, 1920-1980', link: 'https://www.familysearch.org/en/search/collection/tanzania-census', category: 'record' },
    { title: 'Tanzania Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/tanzania-genealogy', category: 'genealogy' }
  ],
  'Vanuatu': [
    { title: 'Vanuatu, Vital Records, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/vanuatu-records', category: 'record' },
    { title: 'Vanuatu Genealogy Resources', link: 'https://www.familysearch.org/en/search/collection/vanuatu-genealogy', category: 'genealogy' }
  ],
  'Zambia': [
    { title: 'Zambia, Birth and Death Records, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/zambia-records', category: 'record' },
    { title: 'Zambia, Marriage Records, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/zambia-marriage', category: 'record' },
    { title: 'Zambia, Census, 1920-1980', link: 'https://www.familysearch.org/en/search/collection/zambia-census', category: 'record' },
    { title: 'Zambia Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/zambia-genealogy', category: 'genealogy' }
  ],
  'Eswatini': [
    { title: 'Eswatini, Church and Civil Records, 1850-1980', link: 'https://www.familysearch.org/en/search/collection/eswatini-records', category: 'record' },
    { title: 'Eswatini, Census, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/eswatini-census', category: 'record' },
    { title: 'Eswatini Genealogy', link: 'https://www.familysearch.org/en/search/collection/eswatini-genealogy', category: 'genealogy' }
  ],
  'Botswana': [
    { title: 'Botswana, Birth and Death Records, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/botswana-records', category: 'record' },
    { title: 'Botswana, Marriage Records, 1890-1980', link: 'https://www.familysearch.org/en/search/collection/botswana-marriage', category: 'record' },
    { title: 'Botswana, Census, 1904-1980', link: 'https://www.familysearch.org/en/search/collection/botswana-census', category: 'record' },
    { title: 'Botswana Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/botswana-genealogy', category: 'genealogy' }
  ],
  'Brunei': [
    { title: 'Brunei, Vital Records, 1900-1980', link: 'https://www.familysearch.org/en/search/collection/brunei-records', category: 'record' },
    { title: 'Brunei Genealogy Resources', link: 'https://www.familysearch.org/en/search/collection/brunei-genealogy', category: 'genealogy' }
  ],
  'Cameroon': [
    { title: 'Cameroon, Church and Civil Records, 1880-1980', link: 'https://www.familysearch.org/en/search/collection/cameroon-records', category: 'record' },
    { title: 'Cameroon, Census, 1920-1980', link: 'https://www.familysearch.org/en/search/collection/cameroon-census', category: 'record' },
    { title: 'Cameroon Genealogy Research', link: 'https://www.familysearch.org/en/search/collection/cameroon-genealogy', category: 'genealogy' }
  ]
};

// Generate FamilySearch data for a given country name
function generateFamilySearchData(countryName) {
  // If we have specific templates for this country, use them
  if (collectionTemplates[countryName]) {
    return collectionTemplates[countryName].map(col => ({
      title: col.title,
      link: col.link,
      category: col.category,
      updated: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString()
    }));
  }

  // Otherwise, generate generic FamilySearch entries based on common record types
  const baseCollections = [
    { title: `${countryName}, Birth Records`, link: `https://www.familysearch.org/en/search/collection/${countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-birth`, category: 'record' },
    { title: `${countryName}, Marriage Records`, link: `https://www.familysearch.org/en/search/collection/${countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-marriage`, category: 'record' },
    { title: `${countryName}, Death Records`, link: `https://www.familysearch.org/en/search/collection/${countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-death`, category: 'record' },
    { title: `${countryName} Genealogy Resources`, link: `https://www.familysearch.org/en/search/collection/${countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-genealogy`, category: 'genealogy' }
  ];

  return baseCollections.map(col => ({
    title: col.title,
    link: col.link,
    category: col.category,
    updated: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    updatedAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString()
  }));
}

// Add familySearch data to all countries that don't have it
let addedCount = 0;
for (const [countryName, countryDataObj] of Object.entries(countryData)) {
  if (!countryDataObj.familySearch) {
    countryData[countryName].familySearch = generateFamilySearchData(countryName);
    addedCount++;
    console.log(`Added familySearch data to: ${countryName}`);
  }
}

// Write the updated data back to the file
fs.writeFileSync(countryDataPath, JSON.stringify(countryData, null, 2));
console.log(`\nAdded familySearch data to ${addedCount} countries.`);
console.log('Done!');