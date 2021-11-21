export interface Template {
    mark: string;
    template: string;
}

export function updateCustomTemplateCut(classTemplate: string): [rest: string, templates: Template[]] {
    const scuri = 'scuri:'
    const templateMark = 'template:';
    if (typeof classTemplate !== 'string' || !classTemplate.includes(`${scuri}${templateMark}`)) {
        return [classTemplate, []];
    }

    const splitBy = `/**${scuri}`;
    const fileSplit = classTemplate
        // remove whitespaces /**  scuri:tempalte -> /**scuri:template
        .replace(/\s*scuri:template:/g, `${scuri}${templateMark}`)
        .split(splitBy, 200);

    const contents = fileSplit.filter((f) => !f.includes(templateMark)).join('');

    const ps = fileSplit
        .filter((f) => f.includes(templateMark))
        .map((s) => s.replace('*/', '').replace(templateMark, ''))
        .map((s) => s.trim())
        .map((s) => {
            const i = s.indexOf(':');
            const len = s.length;
            return { mark: s.slice(0, i), template: s.slice(i + 1, len) };
        });

    return [contents, ps];
}
