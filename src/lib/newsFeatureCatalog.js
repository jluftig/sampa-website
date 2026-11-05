const modules = import.meta.glob('/content/features/*.json', { eager: true });

export default modules;
