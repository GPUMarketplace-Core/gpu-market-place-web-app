# MongoDB Collections (NoSQL) for OpenGPU Final MVP

## node_specs
- **_id**: ObjectId
- **node_id**: UUID (links to Postgres nodes.id)
- **gpus**: [{
    "vendor": "NVIDIA",
    "model": "RTX 4090",
    "vram_gb": 24,
    "count": 1,
    "hourly_price_cents": 250
}]
- **cpu**: {"model": "Ryzen 9 7950X", "cores": 16}
- **memory_gb**: 128
- **storage**: [{"type": "nvme", "size_gb": 2000}]
- **updated_at**: ISODate

## job_configs
- **_id**: ObjectId
- **job_id**: UUID (links to Postgres jobs.id)
- **docker_image**: "pytorch/pytorch:2.4.0-cuda12.1-cudnn9"
- **command**: "python train.py --epochs=10"
- **resources**: {"gpus": 1, "cpu_cores": 8, "mem_gb": 32}
- **updated_at**: ISODate

## job_logs
- **_id**: ObjectId
- **job_run_id**: UUID (links to Postgres job_runs.id)
- **lines**: [{"ts": ISODate, "msg": "epoch=1 loss=..."}, ...]

## job_metrics
- **_id**: ObjectId
- **job_run_id**: UUID (links to Postgres job_runs.id)
- **usage**: {"gpu_util": 0.83, "gpu_mem_gb": 28.1, "cpu_pct": 0.45}
- **billing**: {"seconds": 3600, "rate_cents_per_hour": 250, "cost_cents": 250}
