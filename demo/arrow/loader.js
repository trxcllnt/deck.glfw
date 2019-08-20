import { RecordBatchReader } from 'apache-arrow';

export async function loadFromFile(path, onUpdate) {

    const { body } = await fetch(path, { credentials: 'omit' });
    const reader = await RecordBatchReader.from(body);

    let offset = 0;
    for await (const recordBatch of reader) {
        yieldBatch(recordBatch);
        offset += recordBatch.length;
    }

    function yieldBatch(recordBatch) {
        const values = {
            offset, length: recordBatch.length,
            metadata: recordBatch.schema.metadata,
        };
        recordBatch.schema.fields.forEach(({ name }, index) => {
            values[name] = recordBatch.getChildAt(index).toArray();
        });
        onUpdate(values);
    }
}
