export interface Template {
    mark: string;
    template: string;
}

const scuri = 'scuri:'
const templateMark = 'template:';
export const scuriTemplateMark = `${scuri}${templateMark}`

export function updateCustomTemplateCut(classTemplate: string): [rest: string, templates: Template[]] {
    if (typeof classTemplate !== 'string' || !classTemplate.includes(`${scuriTemplateMark}`)) {
        return [classTemplate, []];
    }

    const splitBy = `/**${scuri}`;
    const fileSplit = classTemplate
        // remove white-spaces '/**  scuri:template ' -> '/**scuri:template:'
        .replace(/\s*scuri:template:/g, `${scuriTemplateMark}`)
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
