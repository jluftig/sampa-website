const modules = import.meta.glob('/content/topic-roundup/*.json', { eager: true });

export default modules;
