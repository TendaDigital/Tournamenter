module.exports = {
  identity: 'view',
  attributes: {
    title: { type: 'string', defaultsTo: '[View Title]' },
    template: { type: 'string', defaultsTo: 'default' },
    pages: { type: 'array', defaultsTo: [] },
  },
  beforeValidate(values, next) {
    if (values.pages) {
      let max = values.pages.reduce((previous, page) => Math.max(previous, Number(page?.id) || 0), 0);
      values.pages = values.pages.map(input => {
        if (!input || typeof input !== 'object') throw Object.assign(new Error('Invalid view page'), {status: 400});
        const page = {
          id: input.id || ++max,
          module: input.module || 'pageview',
          still: input.still ? Math.max(0, Number(input.still) || 0) : '',
          disabled: String(input.disabled) === 'true' ? 'true' : 'false',
          options: input.options && typeof input.options === 'object' ? { ...input.options } : {},
        };
        const extension = app.helpers.Modules.get('pageview', page.module);
        return extension?.beforeValidation ? extension.beforeValidation(page) : page;
      });
    }
    next();
  },
};
