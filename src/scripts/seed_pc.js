import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce-nova";

const mockProducts = [
  // 1. Procesadores
  {
    name: "AMD Ryzen 5 5600X", slug: "amd-ryzen-5-5600x", description: "Procesador AMD Ryzen 5 de 6 núcleos y 12 hilos.", brand: "AMD", category: "Procesadores", price: 200, countInStock: 25, images: ["https://placehold.co/600x400/171717/3adbF1?text=Ryzen+5"],
    features: [{ name: "Socket", value: "AM4" }, { name: "Núcleos", value: "6" }]
  },
  {
    name: "AMD Ryzen 7 5800X3D", slug: "amd-ryzen-7-5800x3d", description: "El mejor procesador para gaming de AM4.", brand: "AMD", category: "Procesadores", price: 350, countInStock: 10, images: ["https://placehold.co/600x400/171717/3adbF1?text=Ryzen+7"],
    features: [{ name: "Socket", value: "AM4" }, { name: "Núcleos", value: "8" }]
  },
  {
    name: "Intel Core i5-12400F", slug: "intel-core-i5-12400f", description: "Excelente relación calidad-precio de Intel.", brand: "Intel", category: "Procesadores", price: 180, countInStock: 30, images: ["https://placehold.co/600x400/171717/3adbF1?text=Core+i5"],
    features: [{ name: "Socket", value: "LGA1700" }, { name: "Núcleos", value: "6" }]
  },
  {
    name: "Intel Core i7-13700K", slug: "intel-core-i7-13700k", description: "Poder absoluto de 13va generación.", brand: "Intel", category: "Procesadores", price: 420, countInStock: 15, images: ["https://placehold.co/600x400/171717/3adbF1?text=Core+i7"],
    features: [{ name: "Socket", value: "LGA1700" }, { name: "Núcleos", value: "16" }]
  },
  {
    name: "AMD Ryzen 9 7950X", slug: "amd-ryzen-9-7950x", description: "Lo máximo en productividad y gaming.", brand: "AMD", category: "Procesadores", price: 600, countInStock: 5, images: ["https://placehold.co/600x400/171717/3adbF1?text=Ryzen+9"],
    features: [{ name: "Socket", value: "AM5" }, { name: "Núcleos", value: "16" }]
  },

  // 2. Mothers
  {
    name: "ASUS ROG Strix B550-F Gaming", slug: "asus-rog-strix-b550", description: "Motherboard B550 con excelente VRM.", brand: "ASUS", category: "Mothers", price: 190, countInStock: 20, images: ["https://placehold.co/600x400/171717/ff00ff?text=Mother+B550"],
    features: [{ name: "Socket", value: "AM4" }, { name: "Formato", value: "ATX" }]
  },
  {
    name: "Gigabyte B660M DS3H", slug: "gigabyte-b660m-ds3h", description: "Placa base accesible para Intel 12va gen.", brand: "Gigabyte", category: "Mothers", price: 120, countInStock: 35, images: ["https://placehold.co/600x400/171717/ff00ff?text=Mother+B660M"],
    features: [{ name: "Socket", value: "LGA1700" }, { name: "Formato", value: "Micro-ATX" }]
  },
  {
    name: "MSI MAG Z690 Tomahawk WiFi", slug: "msi-mag-z690", description: "Para llevar los Core i7 e i9 al límite.", brand: "MSI", category: "Mothers", price: 280, countInStock: 12, images: ["https://placehold.co/600x400/171717/ff00ff?text=Mother+Z690"],
    features: [{ name: "Socket", value: "LGA1700" }, { name: "Formato", value: "ATX" }]
  },
  {
    name: "ASRock X670E Steel Legend", slug: "asrock-x670e", description: "Plataforma AM5 premium de ASRock.", brand: "ASRock", category: "Mothers", price: 320, countInStock: 8, images: ["https://placehold.co/600x400/171717/ff00ff?text=Mother+X670E"],
    features: [{ name: "Socket", value: "AM5" }, { name: "Formato", value: "ATX" }]
  },
  {
    name: "Gigabyte A320M-S2H", slug: "gigabyte-a320m", description: "Motherboard económica para Ryzen.", brand: "Gigabyte", category: "Mothers", price: 60, countInStock: 50, images: ["https://placehold.co/600x400/171717/ff00ff?text=Mother+A320M"],
    features: [{ name: "Socket", value: "AM4" }, { name: "Formato", value: "Micro-ATX" }]
  },

  // 3. Coolers
  {
    name: "Cooler Master Hyper 212", slug: "cooler-master-hyper-212", description: "El disipador clásico por excelencia.", brand: "Cooler Master", category: "Coolers", price: 40, countInStock: 40, images: ["https://placehold.co/600x400/171717/ffffff?text=Hyper+212"],
    features: [{ name: "Tipo", value: "Aire" }, { name: "Tamaño", value: "120mm" }]
  },
  {
    name: "Corsair iCUE H150i Elite", slug: "corsair-icue-h150i", description: "Refrigeración líquida 360mm RGB.", brand: "Corsair", category: "Coolers", price: 180, countInStock: 15, images: ["https://placehold.co/600x400/171717/ffffff?text=Corsair+H150i"],
    features: [{ name: "Tipo", value: "Líquida" }, { name: "Tamaño", value: "360mm" }]
  },
  {
    name: "Noctua NH-D15", slug: "noctua-nh-d15", description: "Silencio y rendimiento extremo por aire.", brand: "Noctua", category: "Coolers", price: 110, countInStock: 25, images: ["https://placehold.co/600x400/171717/ffffff?text=Noctua+D15"],
    features: [{ name: "Tipo", value: "Aire" }, { name: "Tamaño", value: "140mm" }]
  },
  {
    name: "NZXT Kraken X63", slug: "nzxt-kraken-x63", description: "Watercooling de 280mm elegante.", brand: "NZXT", category: "Coolers", price: 150, countInStock: 10, images: ["https://placehold.co/600x400/171717/ffffff?text=Kraken+X63"],
    features: [{ name: "Tipo", value: "Líquida" }, { name: "Tamaño", value: "280mm" }]
  },
  {
    name: "DeepCool AK400", slug: "deepcool-ak400", description: "Disipador de aire compacto y potente.", brand: "DeepCool", category: "Coolers", price: 35, countInStock: 60, images: ["https://placehold.co/600x400/171717/ffffff?text=AK400"],
    features: [{ name: "Tipo", value: "Aire" }, { name: "Tamaño", value: "120mm" }]
  },

  // 4. Memorias RAM
  {
    name: "Corsair Vengeance LPX 16GB (2x8) DDR4", slug: "corsair-vengeance-16gb-ddr4", description: "3200MHz C16, confiabilidad pura.", brand: "Corsair", category: "Memorias RAM", price: 50, countInStock: 100, images: ["https://placehold.co/600x400/171717/3adbF1?text=RAM+16GB+DDR4"],
    features: [{ name: "Tipo", value: "DDR4" }, { name: "Capacidad", value: "16GB" }]
  },
  {
    name: "Kingston FURY Beast 32GB (2x16) DDR5", slug: "kingston-fury-32gb-ddr5", description: "5600MHz para la nueva generación.", brand: "Kingston", category: "Memorias RAM", price: 120, countInStock: 40, images: ["https://placehold.co/600x400/171717/3adbF1?text=RAM+32GB+DDR5"],
    features: [{ name: "Tipo", value: "DDR5" }, { name: "Capacidad", value: "32GB" }]
  },
  {
    name: "G.Skill Trident Z RGB 16GB (2x8) DDR4", slug: "gskill-trident-16gb", description: "3600MHz con el mejor RGB.", brand: "G.Skill", category: "Memorias RAM", price: 70, countInStock: 30, images: ["https://placehold.co/600x400/171717/3adbF1?text=Trident+Z"],
    features: [{ name: "Tipo", value: "DDR4" }, { name: "Capacidad", value: "16GB" }]
  },
  {
    name: "Crucial Ballistix 8GB DDR4", slug: "crucial-8gb-ddr4", description: "Memoria de 2666MHz básica.", brand: "Crucial", category: "Memorias RAM", price: 25, countInStock: 80, images: ["https://placehold.co/600x400/171717/3adbF1?text=Crucial+8GB"],
    features: [{ name: "Tipo", value: "DDR4" }, { name: "Capacidad", value: "8GB" }]
  },
  {
    name: "Corsair Dominator Platinum 64GB DDR5", slug: "corsair-dominator-64gb", description: "La joya de la corona en RAM.", brand: "Corsair", category: "Memorias RAM", price: 280, countInStock: 10, images: ["https://placehold.co/600x400/171717/3adbF1?text=Dominator+64GB"],
    features: [{ name: "Tipo", value: "DDR5" }, { name: "Capacidad", value: "64GB" }]
  },

  // 5. Placas de Video
  {
    name: "NVIDIA RTX 3060 Ti", slug: "nvidia-rtx-3060-ti", description: "La reina del 1080p y 1440p.", brand: "NVIDIA", category: "Placas de Video", price: 400, countInStock: 15, images: ["https://placehold.co/600x400/171717/10b981?text=RTX+3060+Ti"],
    features: [{ name: "VRAM", value: "8GB" }, { name: "Chipset", value: "NVIDIA" }]
  },
  {
    name: "AMD Radeon RX 6700 XT", slug: "amd-rx-6700-xt", description: "Potencia bruta para 1440p.", brand: "AMD", category: "Placas de Video", price: 380, countInStock: 12, images: ["https://placehold.co/600x400/171717/10b981?text=RX+6700+XT"],
    features: [{ name: "VRAM", value: "12GB" }, { name: "Chipset", value: "AMD" }]
  },
  {
    name: "NVIDIA RTX 4070", slug: "nvidia-rtx-4070", description: "Eficiencia y DLSS 3.", brand: "NVIDIA", category: "Placas de Video", price: 600, countInStock: 20, images: ["https://placehold.co/600x400/171717/10b981?text=RTX+4070"],
    features: [{ name: "VRAM", value: "12GB" }, { name: "Chipset", value: "NVIDIA" }]
  },
  {
    name: "NVIDIA RTX 4090", slug: "nvidia-rtx-4090", description: "La placa más potente del mundo.", brand: "NVIDIA", category: "Placas de Video", price: 1600, countInStock: 3, images: ["https://placehold.co/600x400/171717/10b981?text=RTX+4090"],
    features: [{ name: "VRAM", value: "24GB" }, { name: "Chipset", value: "NVIDIA" }]
  },
  {
    name: "AMD Radeon RX 7900 XTX", slug: "amd-rx-7900-xtx", description: "El tope de gama de AMD.", brand: "AMD", category: "Placas de Video", price: 1000, countInStock: 5, images: ["https://placehold.co/600x400/171717/10b981?text=RX+7900+XTX"],
    features: [{ name: "VRAM", value: "24GB" }, { name: "Chipset", value: "AMD" }]
  },

  // 6. Almacenamiento
  {
    name: "Kingston NV2 1TB M.2 NVMe", slug: "kingston-nv2-1tb", description: "SSD veloz y accesible.", brand: "Kingston", category: "Almacenamiento", price: 50, countInStock: 80, images: ["https://placehold.co/600x400/171717/ff00ff?text=SSD+1TB"],
    features: [{ name: "Tipo", value: "NVMe" }, { name: "Capacidad", value: "1TB" }]
  },
  {
    name: "Samsung 980 PRO 2TB", slug: "samsung-980-pro-2tb", description: "Velocidades PCIe 4.0 extremas.", brand: "Samsung", category: "Almacenamiento", price: 150, countInStock: 25, images: ["https://placehold.co/600x400/171717/ff00ff?text=980+PRO"],
    features: [{ name: "Tipo", value: "NVMe" }, { name: "Capacidad", value: "2TB" }]
  },
  {
    name: "WD Blue SN570 500GB", slug: "wd-blue-500gb", description: "SSD ideal para el sistema operativo.", brand: "Western Digital", category: "Almacenamiento", price: 35, countInStock: 60, images: ["https://placehold.co/600x400/171717/ff00ff?text=WD+500GB"],
    features: [{ name: "Tipo", value: "NVMe" }, { name: "Capacidad", value: "500GB" }]
  },
  {
    name: "Seagate Barracuda 2TB HDD", slug: "seagate-2tb-hdd", description: "Almacenamiento masivo a bajo costo.", brand: "Seagate", category: "Almacenamiento", price: 50, countInStock: 50, images: ["https://placehold.co/600x400/171717/ff00ff?text=HDD+2TB"],
    features: [{ name: "Tipo", value: "HDD" }, { name: "Capacidad", value: "2TB" }]
  },
  {
    name: "Crucial MX500 1TB SATA", slug: "crucial-mx500-1tb", description: "SSD SATA confiable.", brand: "Crucial", category: "Almacenamiento", price: 60, countInStock: 40, images: ["https://placehold.co/600x400/171717/ff00ff?text=SATA+1TB"],
    features: [{ name: "Tipo", value: "SATA" }, { name: "Capacidad", value: "1TB" }]
  },

  // 7. Fuentes
  {
    name: "Corsair RM750x 80+ Gold", slug: "corsair-rm750x", description: "Fuente modular de alta calidad.", brand: "Corsair", category: "Fuentes", price: 120, countInStock: 30, images: ["https://placehold.co/600x400/171717/ffffff?text=PSU+750W"],
    features: [{ name: "Potencia", value: "750W" }, { name: "Certificación", value: "80+ Gold" }]
  },
  {
    name: "EVGA 600 W2 80+ White", slug: "evga-600-w2", description: "Para armados económicos.", brand: "EVGA", category: "Fuentes", price: 50, countInStock: 45, images: ["https://placehold.co/600x400/171717/ffffff?text=PSU+600W"],
    features: [{ name: "Potencia", value: "600W" }, { name: "Certificación", value: "80+ White" }]
  },
  {
    name: "Seasonic Focus GX-850", slug: "seasonic-gx850", description: "850W Gold de la mejor marca.", brand: "Seasonic", category: "Fuentes", price: 150, countInStock: 20, images: ["https://placehold.co/600x400/171717/ffffff?text=PSU+850W"],
    features: [{ name: "Potencia", value: "850W" }, { name: "Certificación", value: "80+ Gold" }]
  },
  {
    name: "Gigabyte P550B 80+ Bronze", slug: "gigabyte-p550b", description: "Buena fuente para gama de entrada.", brand: "Gigabyte", category: "Fuentes", price: 60, countInStock: 35, images: ["https://placehold.co/600x400/171717/ffffff?text=PSU+550W"],
    features: [{ name: "Potencia", value: "550W" }, { name: "Certificación", value: "80+ Bronze" }]
  },
  {
    name: "ASUS ROG Thor 1000W Platinum", slug: "asus-rog-thor-1000", description: "Para bestias con RTX 4090.", brand: "ASUS", category: "Fuentes", price: 300, countInStock: 8, images: ["https://placehold.co/600x400/171717/ffffff?text=PSU+1000W"],
    features: [{ name: "Potencia", value: "1000W" }, { name: "Certificación", value: "80+ Platinum" }]
  },

  // 8. Gabinetes
  {
    name: "NZXT H510 Flow", slug: "nzxt-h510-flow", description: "Flujo de aire y diseño minimalista.", brand: "NZXT", category: "Gabinetes", price: 90, countInStock: 25, images: ["https://placehold.co/600x400/171717/3adbF1?text=NZXT+Case"],
    features: [{ name: "Tamaño", value: "Mid-Tower" }]
  },
  {
    name: "Corsair 4000D Airflow", slug: "corsair-4000d", description: "Uno de los mejores gabinetes del mercado.", brand: "Corsair", category: "Gabinetes", price: 100, countInStock: 30, images: ["https://placehold.co/600x400/171717/3adbF1?text=Corsair+Case"],
    features: [{ name: "Tamaño", value: "Mid-Tower" }]
  },
  {
    name: "Lian Li Lancool II Mesh", slug: "lian-li-lancool-ii", description: "Temperaturas excelentes y RGB.", brand: "Lian Li", category: "Gabinetes", price: 110, countInStock: 20, images: ["https://placehold.co/600x400/171717/3adbF1?text=LianLi+Case"],
    features: [{ name: "Tamaño", value: "Mid-Tower" }]
  },
  {
    name: "Cooler Master MasterBox Q300L", slug: "cooler-master-q300l", description: "Micro-ATX accesible.", brand: "Cooler Master", category: "Gabinetes", price: 50, countInStock: 40, images: ["https://placehold.co/600x400/171717/3adbF1?text=Q300L+Case"],
    features: [{ name: "Tamaño", value: "Micro-ATX" }]
  },
  {
    name: "Fractal Design Meshify C", slug: "fractal-meshify", description: "Diseño poligonal hermoso.", brand: "Fractal Design", category: "Gabinetes", price: 120, countInStock: 15, images: ["https://placehold.co/600x400/171717/3adbF1?text=Fractal+Case"],
    features: [{ name: "Tamaño", value: "Mid-Tower" }]
  },

  // 9. Monitores
  {
    name: "LG UltraGear 24GN600 144Hz", slug: "lg-ultragear-24", description: "IPS 144Hz perfecto para esports.", brand: "LG", category: "Monitores", price: 200, countInStock: 30, images: ["https://placehold.co/600x400/171717/ff00ff?text=Monitor+144Hz"],
    features: [{ name: "Panel", value: "IPS" }, { name: "Tasa Refresco", value: "144Hz" }]
  },
  {
    name: "Samsung Odyssey G5 27\" 1440p", slug: "samsung-odyssey-g5", description: "Monitor curvo 165Hz QHD.", brand: "Samsung", category: "Monitores", price: 300, countInStock: 25, images: ["https://placehold.co/600x400/171717/ff00ff?text=Odyssey+G5"],
    features: [{ name: "Panel", value: "VA" }, { name: "Tasa Refresco", value: "165Hz" }]
  },
  {
    name: "AOC C24G1A 24\"", slug: "aoc-c24g1a", description: "Curvo 165Hz económico.", brand: "AOC", category: "Monitores", price: 180, countInStock: 40, images: ["https://placehold.co/600x400/171717/ff00ff?text=AOC+Monitor"],
    features: [{ name: "Panel", value: "VA" }, { name: "Tasa Refresco", value: "165Hz" }]
  },
  {
    name: "Alienware AW3423DWF OLED", slug: "alienware-oled", description: "Ultrawide OLED, lo mejor de lo mejor.", brand: "Alienware", category: "Monitores", price: 1000, countInStock: 5, images: ["https://placehold.co/600x400/171717/ff00ff?text=Alienware+OLED"],
    features: [{ name: "Panel", value: "OLED" }, { name: "Tasa Refresco", value: "165Hz" }]
  },
  {
    name: "ASUS ProArt PA278QV", slug: "asus-proart", description: "Precisión de color para diseñadores.", brand: "ASUS", category: "Monitores", price: 350, countInStock: 15, images: ["https://placehold.co/600x400/171717/ff00ff?text=ProArt"],
    features: [{ name: "Panel", value: "IPS" }, { name: "Tasa Refresco", value: "75Hz" }]
  },

  // 10. Periféricos
  {
    name: "Logitech G Pro X Superlight", slug: "logitech-superlight", description: "Mouse ultraligero competitivo.", brand: "Logitech", category: "Periféricos", price: 150, countInStock: 40, images: ["https://placehold.co/600x400/171717/10b981?text=Superlight"],
    features: [{ name: "Tipo", value: "Mouse" }]
  },
  {
    name: "Razer Huntsman Mini", slug: "razer-huntsman-mini", description: "Teclado 60% óptico.", brand: "Razer", category: "Periféricos", price: 120, countInStock: 35, images: ["https://placehold.co/600x400/171717/10b981?text=Huntsman"],
    features: [{ name: "Tipo", value: "Teclado" }]
  },
  {
    name: "HyperX Cloud II Wireless", slug: "hyperx-cloud-ii", description: "Audífonos legendarios ahora sin cables.", brand: "HyperX", category: "Periféricos", price: 130, countInStock: 50, images: ["https://placehold.co/600x400/171717/10b981?text=Cloud+II"],
    features: [{ name: "Tipo", value: "Audio" }]
  },
  {
    name: "Corsair K70 RGB TKL", slug: "corsair-k70-tkl", description: "Teclado TKL de aluminio.", brand: "Corsair", category: "Periféricos", price: 140, countInStock: 20, images: ["https://placehold.co/600x400/171717/10b981?text=K70+TKL"],
    features: [{ name: "Tipo", value: "Teclado" }]
  },
  {
    name: "SteelSeries QcK Heavy", slug: "steelseries-qck", description: "El mousepad más usado en esports.", brand: "SteelSeries", category: "Periféricos", price: 30, countInStock: 100, images: ["https://placehold.co/600x400/171717/10b981?text=Mousepad"],
    features: [{ name: "Tipo", value: "Accesorio" }]
  }
];

const importData = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("Conectado a MongoDB localmente");

    // Borrar productos anteriores que coincidan con las categorías falsas
    const categories = ["Procesadores", "Mothers", "Coolers", "Memorias RAM", "Placas de Video", "Almacenamiento", "Fuentes", "Gabinetes", "Monitores", "Periféricos"];
    await Product.deleteMany({ category: { $in: categories } });
    console.log("Productos anteriores eliminados");

    // Insertar productos falsos con features
    await Product.insertMany(mockProducts);
    console.log("Nuevos datos con características importados con éxito");

    process.exit();
  } catch (error) {
    console.error("Error importando los datos:", error);
    process.exit(1);
  }
};

importData();
