export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Tùy chỉnh']

export const SIZE_GUIDE_FIELDS = [
  { key: 'bust', label: 'Ngực', placeholder: '84-88 cm' },
  { key: 'waist', label: 'Eo', placeholder: '64-68 cm' },
  { key: 'hip', label: 'Mông', placeholder: '88-92 cm' },
  { key: 'height', label: 'Chiều cao', placeholder: '155-162 cm' },
  { key: 'weight', label: 'Cân nặng', placeholder: '45-52 kg' },
  { key: 'note', label: 'Ghi chú', placeholder: 'Form ôm nhẹ, co giãn ít' },
]

export const DEFAULT_SIZE_GUIDE = {
  XS: { bust: '78-82 cm', waist: '58-62 cm', hip: '84-88 cm', height: '148-154 cm', weight: '38-44 kg', note: 'Form nhỏ, hợp dáng mảnh' },
  S: { bust: '82-86 cm', waist: '62-66 cm', hip: '88-92 cm', height: '150-158 cm', weight: '42-48 kg', note: 'Form chuẩn, ôm vừa cơ thể' },
  M: { bust: '86-90 cm', waist: '66-70 cm', hip: '92-96 cm', height: '156-164 cm', weight: '48-55 kg', note: 'Dễ mặc nhất, hợp đa số khách' },
  L: { bust: '90-96 cm', waist: '70-76 cm', hip: '96-102 cm', height: '160-168 cm', weight: '55-63 kg', note: 'Thoải mái hơn ở vai và eo' },
  XL: { bust: '96-102 cm', waist: '76-84 cm', hip: '102-108 cm', height: '165-173 cm', weight: '63-72 kg', note: 'Form rộng, phù hợp người cao' },
  XXL: { bust: '102-110 cm', waist: '84-92 cm', hip: '108-116 cm', height: '168-178 cm', weight: '72-82 kg', note: 'Dành cho dáng lớn hoặc cần mặc rộng' },
  'Tùy chỉnh': { bust: 'Theo số đo', waist: 'Theo số đo', hip: 'Theo số đo', height: 'Theo số đo', weight: 'Theo số đo', note: 'Seller sẽ xác nhận riêng theo số đo khách' },
}

export function createSizeGuide(size) {
  return {
    size,
    ...(DEFAULT_SIZE_GUIDE[size] ?? {
      bust: '',
      waist: '',
      hip: '',
      height: '',
      weight: '',
      note: '',
    }),
  }
}

export function normalizeSizeGuide(sizes = [], sizeGuide = {}) {
  return sizes.map(size => ({
    size,
    ...(sizeGuide[size] ?? createSizeGuide(size)),
  }))
}
